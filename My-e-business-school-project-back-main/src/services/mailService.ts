// services/mailService.ts
import nodemailer from "nodemailer";

export const MailService = {
  async sendActivationEmail(to: string, token: string, firstName: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const activationLink = `${process.env.FRONTEND_URL}/activate?token=${token}`;

    await transporter.sendMail({
      from: `"La Ruche Académie " <${process.env.SMTP_USER}>`,
      to,
      subject: "Bienvenue à La Ruche Académie : ton accès à la plateforme est prêt 🐝",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>Bonjour <strong>${firstName || "cher étudiant"}</strong>,</p>

          <p>Félicitations et bienvenue à <strong>La Ruche Académie</strong> !</p>

          <p>Ton inscription est désormais finalisée et ton aventure d'apprentissage peut commencer.</p>

          <p style="text-align: center; margin: 20px 0;">
            <a href="${activationLink}" 
               style="background-color: #ffc107; color: #000; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Activer mon compte
            </a>
          </p>

          <p>En cliquant sur ce lien, tu pourras définir ton mot de passe et accéder à la plateforme.</p>

          <p>Sur ton espace personnel, tu retrouveras tout ce qu'il te faut pour bien démarrer  :</p>
          <ul>
            <li>Ton <strong>calendrier de cours</strong> et les temps forts de l’année,</li>
            <li>La <strong>liste de tes formateurs</strong> et des contacts utiles,</li>
            <li>Des <strong>ressources à disposition pour t’aider dans tes cours et dans ta vie en entreprise.</li>
          </ul>

          <p>Notre équipe reste disponible pour t'accompagner à chaque étape. N'hésite pas à nous écrire à <a href="mailto:contact@la-ruche-academie.com">contact@la-ruche-academie.com</a> si tu rencontres la moindre difficulté de connexion. </p>

          <p>Encore bienvenue dans la ruche : ici, on apprend, on échange, on crée, ensemble 💛</p>

          <p>À très bientôt,<br>L’équipe de <strong>La Ruche Académie</strong></p>
        </div>
      `,
    });
  },

  async sendGenericEmail(to: string, subject: string, body: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"La Ruche Académie " <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: `<p>${body.replace(/\n/g, "<br/>")}</p>`,
    });
  },

async sendInscriptionEmail(to: string, firstName: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const subject = "Lien d’inscription - La Ruche Académie";
    const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Bonjour <strong>${firstName}</strong>,</p>
      <p>Voici ton lien d’inscription à <strong>La Ruche Académie</strong> :</p>
      <p style="text-align: center; margin: 20px 0;">
        <a href="https://tally.so/r/w260WA" 
           style="background-color: #ffc107; color: #000; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Compléter mon inscription
        </a>
      </p>
      <p>Tu peux finaliser ton dossier en cliquant sur ce lien.</p>
      <p>Cordialement,<br>L’équipe de La Ruche Académie 🐝</p>
    </div>
  `;

    await transporter.sendMail({
      from: `"La Ruche Académie " <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  },

  async sendPasswordResetEmail(to: string, token: string, firstName: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"La Ruche Académie " <${process.env.SMTP_USER}>`,
      to,
      subject: "Réinitialisation de votre mot de passe - La Ruche Académie 🔐",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ffc107, #ff9800); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: #000; text-align: center; margin: 0;">🔐 Réinitialisation de mot de passe</h1>
          </div>
          
          <div style="background: #fff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p>Bonjour <strong>${firstName || "cher utilisateur"}</strong>,</p>

            <p>Vous avez demandé une réinitialisation de votre mot de passe pour votre compte La Ruche Académie.</p>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #ffc107; color: #000; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                  🔓 Réinitialiser mon mot de passe
              </a>
            </p>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;">
                <strong>⚠️ Important :</strong><br>
                • Ce lien est valable pendant <strong>1 heure</strong><br>
                • Si vous n'avez pas demandé cette réinitialisation, ignorez ce message<br>
                • Votre mot de passe actuel reste inchangé tant que vous n'en définissez pas un nouveau
              </p>
            </div>

            <p style="font-size: 14px; color: #666;">
              Si le lien ne fonctionne pas, copiez et collez cette adresse dans votre navigateur :<br>
              <code style="background-color: #f1f1f1; padding: 5px; border-radius: 3px; word-break: break-all;">${resetLink}</code>
            </p>

            <p>Besoin d'aide ? Contactez-nous à <a href="mailto:contact@la-ruche-academie.com">contact@la-ruche-academie.com</a></p>

            <p>À bientôt,<br><strong>L'équipe La Ruche Académie</strong></p>
          </div>
        </div>
      `,
    });
  },

  async sendTeacherActivationEmail(to: string, token: string, firstName: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const activationLink = `${process.env.FRONTEND_URL}/activate?token=${token}`;

    await transporter.sendMail({
      from: `"La Ruche Académie" <${process.env.SMTP_USER}>`,
      to,
      subject: "Activation de votre compte enseignant",
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color:#333">
        <h2>Bonjour ${firstName},</h2>
        <p>Votre compte enseignant a été créé sur la plateforme La Ruche Académie.</p>
        <p>Veuillez cliquer sur le bouton ci-dessous afin d’activer votre compte et choisir votre mot de passe :</p>
        <p>
          <a href="${activationLink}" 
            style="background-color: #ffc107; color: #000; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Activer mon compte
          </a>
        </p>
        <p>Cordialement,<br>L’équipe de La Ruche Académie 🐝</p>
      </div>
    `,
    });
  },

};

