const nodemailer = require('nodemailer');
// Gmail via an App Password (Google Account → Security → App passwords).
// Without EMAIL_USER / EMAIL_PASS the email is printed to the terminal instead — handy locally.
const isConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
let transporter = null;
const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
    }
    return transporter;
};

const sendPasswordResetCode = async (to, name, code) => {
    if (!isConfigured()) {
        console.log(`\n[mailer] Email not configured — password reset code for ${to}: ${code}\n`);
        return;
    }
    await getTransporter().sendMail({
        from: `"HireAI" <${process.env.EMAIL_USER}>`,
        to,
        subject: `${code} is your HireAI password reset code`,
        text: `Hi ${name},\n\nYour HireAI password reset code is ${code}.\nIt expires in 10 minutes.\n\nIf you didn't ask to reset your password, you can ignore this email.`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#16152b">
                <div style="display:inline-block;background:#6366f1;color:#fff;font-weight:700;padding:6px 14px;border-radius:8px">HireAI</div>
                <p style="margin-top:24px">Hi ${name.replace(/[<>&"]/g, '')},</p>
                <p>Use this code to reset your password:</p>
                <p style="font-size:32px;font-weight:700;letter-spacing:8px;background:#f0f0f8;padding:16px;border-radius:10px;text-align:center">${code}</p>
                <p style="color:#54536f;font-size:14px">It expires in 10 minutes. If you didn't ask to reset your password, you can ignore this email.</p>
            </div>`,
    });
};

module.exports = { sendPasswordResetCode, isEmailConfigured: isConfigured };
