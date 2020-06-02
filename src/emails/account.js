const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = ({ email, name }) => {
    sgMail.send({
        to: email,
        from: 'vitormarquespio@gmail.com',
        subject: 'Thanks for joinning in',
        text: `Welcome to the weather app ${name}.`
    })
}

const sendGoodbyeEmail = ({ email, name }) => {
    sgMail.send({
        to: email,
        from: 'vitormarquespio@gmail.com',
        subject: 'Sorry to see you go',
        text: `Goodbye ${name}, thanks for using our service.`
    })
}

module.exports = { sendWelcomeEmail, sendGoodbyeEmail }
