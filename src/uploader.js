const AWS = require('aws-sdk')
const fs = require('fs')
const shortid = require('shortid')

const env = process.env

const awsConfig = {
    s3: new AWS.S3(new AWS.Config({
        credentials: new AWS.SharedIniFileCredentials({ profile: env['TESTCAFE_SLACK_UPLOADER_AWS_PROFILE'] || 'default' })
    })),
    bucket: env['TESTCAFE_SLACK_UPLOADER_S3_BUCKET'] || 'bucket',
    keyBase: env['TESTCAFE_SLACK_UPLOADER_S3_KEY'] || ''
}

const uploadFile = function(filePath, aws) {
    let file
    try {
        file = fs.readFileSync(filePath)
    } catch(error) {
        return Promise.reject(error)
    }

    return new Promise((resolve, reject) => {
        try {
            const key = aws.keyBase + shortid() + '.png'
            const params = {
                Bucket: aws.bucket,
                Key: key,
                Body: file, ACL: 'public-read',
                ContentType: 'image/png'
            }

            aws.s3.putObject(params, function(error, data) {
                if (error)
                    return reject(error)

                const url = `http://s3.amazonaws.com/${aws.bucket}/${key}`
                return resolve(url)
            })
        } catch(error) {
            return reject(error)
        }
    })
}

const processAttachments = attachments => Promise.all(attachments.map(attachment => {
    if(!attachment.image_url)
        return Promise.resolve(attachment)

    return uploadFile(attachment.image_url, awsConfig)
        .then(url => ({
            ...attachment,
            image_url: url
        }))
        .catch(error => {
            console.log(error)
            delete attachment.image_url
            return attachment
        })
}))

module.exports = {
    uploadFile,
    processAttachments
}