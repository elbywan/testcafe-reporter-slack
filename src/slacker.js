require('dotenv').config()
const envs = require('envs')
const { processAttachments }  = require(envs('TESTCAFE_SLACK_UPLOADER_PATH', './uploader'))
const slackNode = require('slack-node')

const slack = new slackNode()
slack.setWebhook(envs('TESTCAFE_SLACK_WEBHOOK', 'http://example.com'))

const message = []
const errorMessage = []
const attachments = []

const sendMessage = (message, slackProperties = null, exit) => {
    slack.webhook({
        channel: envs('TESTCAFE_SLACK_CHANNEL', '#testcafe'),
        username: envs('TESTCAFE_SLACK_BOT', 'testcafebot'),
        text: message,
        ...slackProperties
    }, function (err, response) {
        if(err) {
            console.log('Unable to send a message to slack')
            console.log(response)
            if(exit) process.exit(1)
        } else {
            console.log(`The following message is sent to slack: \n ${message}`)
            if(exit) process.exit(0)
        }
    })
}

const sendReport = (nrFailedTests) => {
    processAttachments(attachments).then(uploadedAttachments => {
        const slackProperties = nrFailedTests === 0 ? null : {
            "attachments": [
                ...uploadedAttachments
            ]
        }
        sendMessage(message.join("\n"), slackProperties, true)
    }).catch(error => {
        console.error(error)
        process.exit(1)
    })
}


process.on('message', ({ action, data }) => {
    switch(action) {
        case 'addMessage':
            message.push(data)
            break
        case 'addError':
            attachments.push({
                color: 'danger',
                text: '```' + data.message + '```',
                image_url: data.screenshotPath
            })
            break
        case 'sendMessage':
            sendMessage(data)
            break
        case 'sendReport':
            sendReport(data)
            break
        case 'exit':
            process.exit
    }
})