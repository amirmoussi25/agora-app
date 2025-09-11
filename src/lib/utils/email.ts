import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  // Pour développement : Mailtrap (emails de test)
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
  
  // Pour recevoir de vrais emails, décommentez ceci et ajoutez vos variables d'environnement :
  /*
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // votre.email@gmail.com
    pass: process.env.GMAIL_APP_PASSWORD // mot de passe d'application Gmail
  }
  */
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: '"Agora" <noreply@agora.com>',
    to: email,
    subject: 'Vérifiez votre compte Agora',
    html: `
      <h1>Vérification de votre compte</h1>
      <p>Cliquez sur le lien ci-dessous pour vérifier votre compte :</p>
      <a href="${verificationUrl}">Vérifier mon compte</a>
      <p>Ce lien expire dans 24 heures.</p>
    `
  });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
  
  await transporter.sendMail({
    from: '"Agora" <noreply@agora.com>',
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <h1>Réinitialisation de mot de passe</h1>
      <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
      <p>Ce lien expire dans 1 heure.</p>
    `
  });
};