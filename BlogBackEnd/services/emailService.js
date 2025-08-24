const nodemailer = require('nodemailer');


const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS
        }
    });
};

const emailTemplates = {
    registration: (userName) => ({
        subject: 'Welcome to the Blog Platform!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Welcome to the Blog Platform!</h2>
                <p>Dear ${userName},</p>
                <p>Thank you for registering with our blog platform! Your account has been successfully created.</p>
                <p>You can now:</p>
                <ul>
                    <li>Create and publish blog posts</li>
                    <li>Comment on other posts</li>
                    <li>Like and interact with content</li>
                </ul>
                <p><strong>Note:</strong> Your posts will need admin approval before they become visible to other users.</p>
                <p>Happy blogging!</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">This is an automated message from our blog platform.</p>
            </div>
        `
    }),

    postApproved: (userName, postTitle) => ({
        subject: 'Your Post Has Been Approved!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #28a745;">Post Approved!</h2>
                <p>Dear ${userName},</p>
                <p>Great news! Your blog post has been approved and is now live on our platform.</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin: 0; color: #333;">Post Title:</h3>
                    <p style="margin: 5px 0 0 0; font-weight: bold;">"${postTitle}"</p>
                </div>
                <p>Your post is now visible to all users and they can like, comment, and interact with your content.</p>
                <p>Keep up the great work!</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">This is an automated message from our blog platform.</p>
            </div>
        `
    }),

    newComment: (postAuthorName, commenterName, postTitle, commentText) => ({
        subject: 'New Comment on Your Post',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #007bff;">New Comment on Your Post!</h2>
                <p>Dear ${postAuthorName},</p>
                <p>Someone has commented on your blog post!</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin: 0; color: #333;">Post:</h3>
                    <p style="margin: 5px 0; font-weight: bold;">"${postTitle}"</p>
                    <h4 style="margin: 15px 0 5px 0; color: #333;">Comment by ${commenterName}:</h4>
                    <p style="margin: 0; padding: 10px; background-color: white; border-left: 4px solid #007bff; border-radius: 3px;">
                        ${commentText}
                    </p>
                </div>
                <p>Log in to your account to view the full comment and reply if you'd like!</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">This is an automated message from our blog platform.</p>
            </div>
        `
    })
};


const sendEmail = async (to, template) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: template.subject,
            html: template.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};


const sendRegistrationEmail = async (userEmail, userName) => {
    const template = emailTemplates.registration(userName);
    return await sendEmail(userEmail, template);
};

const sendPostApprovedEmail = async (userEmail, userName, postTitle) => {
    const template = emailTemplates.postApproved(userName, postTitle);
    return await sendEmail(userEmail, template);
};

const sendNewCommentEmail = async (postAuthorEmail, postAuthorName, commenterName, postTitle, commentText) => {
    const template = emailTemplates.newComment(postAuthorName, commenterName, postTitle, commentText);
    return await sendEmail(postAuthorEmail, template);
};

module.exports = {
    sendRegistrationEmail,
    sendPostApprovedEmail,
    sendNewCommentEmail
};
