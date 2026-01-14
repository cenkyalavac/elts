import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        const { documentUrl, quizTitle, quizDescription, sourceLanguage, targetLanguage, specialization, serviceType, timeLimit, passingScore } = await req.json();

        if (!documentUrl) {
            return Response.json({ error: 'Document URL is required' }, { status: 400 });
        }

        // Extract document ID from URL
        const docIdMatch = documentUrl.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
        if (!docIdMatch) {
            return Response.json({ error: 'Invalid Google Docs URL' }, { status: 400 });
        }
        const documentId = docIdMatch[1];

        // Get OAuth access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledocs');

        // Fetch document content
        const docResponse = await fetch(
            `https://docs.googleapis.com/v1/documents/${documentId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!docResponse.ok) {
            const error = await docResponse.text();
            return Response.json({ 
                error: 'Failed to fetch document', 
                details: error,
                status: docResponse.status 
            }, { status: 400 });
        }

        const document = await docResponse.json();

        // Extract structured content with formatting info for better LLM analysis
        let rawText = '';
        let structuredContent = [];
        
        for (const element of document.body.content) {
            if (!element.paragraph) continue;
            
            let paragraphText = '';
            let hasHighlight = false;
            
            for (const textElement of element.paragraph.elements || []) {
                if (textElement.textRun) {
                    const content = textElement.textRun.content;
                    paragraphText += content;
                    rawText += content;
                    
                    // Check for highlighting
                    const style = textElement.textRun.textStyle;
                    if (style?.backgroundColor?.color?.rgbColor) {
                        hasHighlight = true;
                    }
                }
            }
            
            if (paragraphText.trim()) {
                structuredContent.push({
                    text: paragraphText.trim(),
                    highlighted: hasHighlight
                });
            }
        }
        
        console.log('Document parsed:', {
            totalParagraphs: structuredContent.length,
            highlightedParagraphs: structuredContent.filter(p => p.highlighted).length,
            rawTextLength: rawText.length
        });

        // Use LLM to do a comprehensive analysis of the document
        const contentPreview = structuredContent.map((p, idx) => 
            `[${p.highlighted ? 'HIGHLIGHTED' : 'normal'}] ${p.text.substring(0, 200)}`
        ).join('\n');
        
        const llmPrompt = `You are analyzing a quiz document from Google Docs. Carefully analyze the entire document structure.

DOCUMENT STRUCTURE:
${contentPreview}

FULL TEXT:
${rawText}

CRITICAL INSTRUCTIONS:
1. Identify ALL quiz questions - look for patterns like:
   - "1. Question text here"
   - "Question 1: Text here"
   - "Q1) Text here"
   - Or any numbered pattern

2. For EACH question found, extract:
   - question_text: The actual question (without the number prefix)
   - options: All answer choices (A/B/C/D, or bullets, or any format)
   - points: Look for "(5 points)", "10p", "(5)", "5 pts" near the question. DEFAULT to 1 if not found.
   - section: Any category/section mentioned (e.g., "Grammar", "Part 1", "Vocabulary")
   - is_true_false: true only if it's a True/False question

3. HIGHLIGHTED text (marked as [HIGHLIGHTED]) usually indicates the CORRECT ANSWER
4. Ignore highlighted section headers/instructions - only answer options should be highlighted
5. Be VERY flexible with formatting - don't require strict patterns

Return ALL questions you can find, even if formatting is inconsistent:`;

        let llmAnalysis = { questions: [], ignore_highlighted_phrases: [] };
        try {
            const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt: llmPrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        questions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    number: { type: "number" },
                                    question_text: { type: "string" },
                                    points: { type: "number" },
                                    section: { type: "string" },
                                    is_true_false: { type: "boolean" },
                                    options: { 
                                        type: "array",
                                        items: { type: "string" }
                                    }
                                },
                                required: ["number", "question_text", "points"]
                            }
                        },
                        ignore_highlighted_phrases: {
                            type: "array",
                            items: { type: "string" }
                        }
                    },
                    required: ["questions"]
                }
            });
            llmAnalysis = llmResponse;
            console.log('LLM Analysis Result:', {
                questionsFound: llmAnalysis.questions?.length || 0,
                ignorePhrases: llmAnalysis.ignore_highlighted_phrases?.length || 0,
                sampleQuestion: llmAnalysis.questions?.[0]
            });
        } catch (error) {
            console.error('LLM analysis failed:', error);
            // Continue with parsing even if LLM fails
        }

        // If LLM found questions with full structure, use those primarily
        const questions = [];
        let questionCounter = 0;
        
        // First, try to use LLM-extracted questions as base
        if (llmAnalysis.questions && llmAnalysis.questions.length > 0) {
            for (const llmQ of llmAnalysis.questions) {
                questionCounter++;
                questions.push({
                    question_text: llmQ.question_text,
                    question_type: llmQ.is_true_false ? 'true_false' : 'multiple_choice',
                    options: llmQ.is_true_false ? ['True', 'False'] : (llmQ.options || []),
                    correct_answer: null, // Will be filled by highlight detection
                    points: llmQ.points || 1,
                    order: questionCounter,
                    section: llmQ.section || null,
                    llm_extracted: true
                });
            }
        }

        // Parse document content to extract highlights and validate
        let currentQuestion = null;
        let parseQuestionCounter = 0;

        for (const element of document.body.content) {
            if (!element.paragraph) continue;

            const paragraph = element.paragraph;
            let text = '';
            let hasHighlight = false;
            let highlightColor = null;

            // Extract text and check for highlighting
            for (const textElement of paragraph.elements || []) {
                if (textElement.textRun) {
                    const content = textElement.textRun.content.trim();
                    if (content) {
                        text += content;
                        
                        // Check for background color (highlight)
                        const style = textElement.textRun.textStyle;
                        if (style?.backgroundColor?.color?.rgbColor) {
                            hasHighlight = true;
                            const rgb = style.backgroundColor.color.rgbColor;
                            // Convert to hex-like for identification
                            highlightColor = `${rgb.red || 0}-${rgb.green || 0}-${rgb.blue || 0}`;
                        }
                    }
                }
            }

            if (!text) continue;

            // Check if this is a question (starts with number or "Question")
            const questionMatch = text.match(/^(\d+\.|Question\s+\d+|Q\d+)[:\s]?\s*(.+)/i);
            if (questionMatch) {
                parseQuestionCounter++;
                
                // Find matching LLM question if exists
                currentQuestion = questions.find(q => q.llm_extracted && q.order === parseQuestionCounter);
                
                // If no LLM match, create new question from parsing
                if (!currentQuestion) {
                    currentQuestion = {
                        question_text: questionMatch[2].trim(),
                        question_type: 'multiple_choice',
                        options: [],
                        correct_answer: null,
                        points: 1,
                        order: parseQuestionCounter,
                        llm_extracted: false
                    };
                    questions.push(currentQuestion);
                }
            } else if (currentQuestion) {
                // Check if this is an option (starts with letter, bullet, or dash)
                const optionMatch = text.match(/^([A-D])[:\)\.\s]\s*(.+)|^[-•]\s*(.+)/i);
                if (optionMatch) {
                    const optionText = (optionMatch[2] || optionMatch[3]).trim();
                    
                    // Skip if this is a section header or instruction that was accidentally highlighted
                    const shouldIgnore = llmAnalysis.ignore_highlighted_phrases.some(phrase => 
                        optionText.toLowerCase().includes(phrase.toLowerCase()) ||
                        phrase.toLowerCase().includes(optionText.toLowerCase())
                    );
                    
                    if (!shouldIgnore) {
                        // Only add option if not already present (from LLM)
                        if (!currentQuestion.options.includes(optionText)) {
                            currentQuestion.options.push(optionText);
                        }

                        // If this option is highlighted, mark as correct
                        if (hasHighlight) {
                            currentQuestion.correct_answer = optionText;
                        }
                    }
                } else {
                    // Check for True/False questions
                    const tfMatch = text.match(/^(True|False|T\/F|TRUE\/FALSE)/i);
                    if (tfMatch && currentQuestion && currentQuestion.options.length === 0) {
                        currentQuestion.question_type = 'true_false';
                        currentQuestion.options = ['True', 'False'];
                        
                        // If the line is highlighted, use it as the answer
                        if (hasHighlight) {
                            if (text.toLowerCase().includes('true')) {
                                currentQuestion.correct_answer = 'True';
                            } else if (text.toLowerCase().includes('false')) {
                                currentQuestion.correct_answer = 'False';
                            }
                        }
                    }
                }
            }
        }

        // Clean up llm_extracted flag
        questions.forEach(q => {
            delete q.llm_extracted;
            // Ensure points are reasonable (between 1 and 100)
            if (!q.points || q.points < 1) q.points = 1;
            if (q.points > 100) q.points = 100;
        });

        // Validate questions
        const validQuestions = questions.filter(q => {
            if (!q.correct_answer) {
                console.warn(`Question without correct answer: ${q.question_text}`);
                return false;
            }
            if (q.options.length < 2) {
                console.warn(`Question with insufficient options: ${q.question_text}`);
                return false;
            }
            return true;
        });

        console.log('Validation results:', {
            totalParsed: questions.length,
            validQuestions: validQuestions.length,
            invalidQuestions: questions.filter(q => !validQuestions.includes(q)).map(q => ({
                text: q.question_text?.substring(0, 50),
                hasCorrectAnswer: !!q.correct_answer,
                optionCount: q.options.length,
                options: q.options
            }))
        });

        if (validQuestions.length === 0) {
            return Response.json({ 
                error: 'No valid questions found in document. Please check the debug info below.',
                debug: {
                    totalParagraphs: structuredContent.length,
                    highlightedParagraphs: structuredContent.filter(p => p.highlighted).length,
                    llmFoundQuestions: llmAnalysis.questions?.length || 0,
                    parsedQuestions: questions.length,
                    validQuestions: validQuestions.length,
                    sampleParagraphs: structuredContent.slice(0, 10).map(p => ({
                        text: p.text.substring(0, 100),
                        highlighted: p.highlighted
                    })),
                    questionsDetail: questions.map(q => ({
                        text: q.question_text?.substring(0, 80),
                        hasCorrectAnswer: !!q.correct_answer,
                        correctAnswer: q.correct_answer?.substring(0, 50),
                        optionCount: q.options.length,
                        options: q.options.map(o => o.substring(0, 50)),
                        points: q.points
                    })),
                    llmQuestions: llmAnalysis.questions?.slice(0, 3)
                },
                suggestion: 'Please ensure: 1) Questions are numbered (1., 2., etc.), 2) Correct answers are highlighted with background color, 3) Each question has at least 2 options'
            }, { status: 400 });
        }

        // Calculate total points
        const totalPoints = validQuestions.reduce((sum, q) => sum + q.points, 0);

        // Create Quiz entity
        const quiz = await base44.asServiceRole.entities.Quiz.create({
            title: quizTitle || document.title || 'Imported Quiz',
            description: quizDescription || `Imported from Google Doc: ${document.title}`,
            source_language: sourceLanguage,
            target_language: targetLanguage,
            service_type: serviceType,
            specialization: specialization,
            time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
            passing_score: passingScore ? parseInt(passingScore) : null,
            total_points: totalPoints,
            is_active: true,
            required_for_approval: false
        });

        // Create Question entities
        const createdQuestions = await base44.asServiceRole.entities.Question.bulkCreate(
            validQuestions.map(q => ({
                quiz_id: quiz.id,
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options,
                correct_answer: q.correct_answer,
                points: q.points,
                order: q.order,
                section: q.section || null
            }))
        );

        return Response.json({
            success: true,
            quiz: {
                id: quiz.id,
                title: quiz.title,
                totalQuestions: createdQuestions.length,
                totalPoints: totalPoints
            },
            questions: createdQuestions.length,
            skippedQuestions: questions.length - validQuestions.length
        });

    } catch (error) {
        console.error('Error generating quiz:', error);
        return Response.json({ 
            error: error.message,
            details: error.stack 
        }, { status: 500 });
    }
});