import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { positionId, companyUrn, postText, applyUrl } = await req.json();

        if (!positionId || !companyUrn || !postText) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const accessToken = await base44.asServiceRole.connectors.getAccessToken('linkedin');

        // Create the post content
        const postBody = {
            author: companyUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: postText
                    },
                    shareMediaCategory: 'ARTICLE',
                    media: [
                        {
                            status: 'READY',
                            originalUrl: applyUrl,
                            title: {
                                text: 'Apply Now'
                            },
                            description: {
                                text: 'Click to apply for this position'
                            }
                        }
                    ]
                }
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
            }
        };

        console.log('Posting to LinkedIn:', JSON.stringify(postBody));

        const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify(postBody)
        });

        if (!postResponse.ok) {
            const error = await postResponse.text();
            console.error('LinkedIn post error:', error);
            return Response.json({ error: 'Failed to post to LinkedIn: ' + error }, { status: 500 });
        }

        const postResult = await postResponse.json();
        console.log('LinkedIn post result:', JSON.stringify(postResult));

        // Update the position with LinkedIn post info
        await base44.asServiceRole.entities.OpenPosition.update(positionId, {
            linkedin_post_id: postResult.id,
            linkedin_posted_at: new Date().toISOString()
        });

        return Response.json({ 
            success: true, 
            postId: postResult.id,
            message: 'Successfully posted to LinkedIn'
        });

    } catch (error) {
        console.error('Error posting to LinkedIn:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});