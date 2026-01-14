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

        // Extract raw text content for LLM processing
        let rawText = '';
        for (const element of document.body.content) {
            if (!element.paragraph) continue;
            for (const textElement of element.paragraph.elements || []) {
                if (textElement.textRun) {
                    rawText += textElement.textRun.content;
                }
            }
        }

        // Use LLM to enhance question parsing, grouping, and point assignment
        const llmPrompt = `You are analyzing a quiz document. Your task is to:
1. Identify ONLY actual quiz questions (ignore section headers, instructions, or descriptive text)
2. For each question, determine:
   - Question number
   - Point value (look for indicators like "5 points", "10p", "(5)", etc. - if not specified, default to 1)
   - Section/topic it belongs to (e.g., Grammar, Vocabulary, Reading Comprehension)
3. Identify any highlighted text that is NOT an answer option (like section headers, instructions) - these should be ignored

Document text:
${rawText}

Return ONLY a JSON object in this format:
{
  "questions": [
    {"number": 1, "points": 5, "section": "Grammar"},
    {"number": 2, "points": 10, "section": "Grammar"},
    {"number": 3, "points": 5, "section": "Vocabulary"}
  ],
  "ignore_highlighted_phrases": ["Grammar Section", "Instructions:", "Part 1"]
}`;

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
                                    points: { type: "number" },
                                    section: { type: "string" }
                                }
                            }
                        },
                        ignore_highlighted_phrases: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });
            llmAnalysis = llmResponse;
        } catch (error) {
            console.warn('LLM analysis failed, using defaults:', error.message);
        }

        // Parse document content
        const questions = [];
        let currentQuestion = null;
        let questionCounter = 0;

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
                // Save previous question if exists
                if (currentQuestion && currentQuestion.options.length > 0) {
                    questions.push(currentQuestion);
                }

                // Start new question
                questionCounter++;
                currentQuestion = {
                    question_text: questionMatch[2].trim(),
                    question_type: 'multiple_choice',
                    options: [],
                    correct_answer: null,
                    points: 1,
                    order: questionCounter
                };
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
                        currentQuestion.options.push(optionText);

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

        // Add last question
        if (currentQuestion && currentQuestion.options.length > 0) {
            questions.push(currentQuestion);
        }

        // Assign sections and points to questions based on LLM analysis
        questions.forEach((q, idx) => {
            const questionNum = idx + 1;
            const llmQuestion = llmAnalysis.questions.find(lq => lq.number === questionNum);
            
            if (llmQuestion) {
                q.section = llmQuestion.section || null;
                q.points = llmQuestion.points || 1;
            } else {
                q.points = 1; // Default to 1 point if LLM didn't find point value
            }
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

        if (validQuestions.length === 0) {
            return Response.json({ 
                error: 'No valid questions found in document. Please ensure questions are numbered and correct answers are highlighted.',
                parsedQuestions: questions.length,
                validQuestions: validQuestions.length
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