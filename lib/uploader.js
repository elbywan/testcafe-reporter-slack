'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var AWS = require('aws-sdk');
var fs = require('fs');
var shortid = require('shortid');

var env = process.env;

var awsConfig = {
    s3: new AWS.S3(new AWS.Config({
        credentials: new AWS.SharedIniFileCredentials({ profile: env['TESTCAFE_SLACK_UPLOADER_AWS_PROFILE'] || 'default' })
    })),
    bucket: env['TESTCAFE_SLACK_UPLOADER_S3_BUCKET'] || 'bucket',
    keyBase: env['TESTCAFE_SLACK_UPLOADER_S3_KEY'] || ''
};

var uploadFile = function uploadFile(filePath, aws) {
    var file = undefined;
    try {
        file = fs.readFileSync(filePath);
    } catch (error) {
        return Promise.reject(error);
    }

    return new Promise(function (resolve, reject) {
        try {
            (function () {
                var key = aws.keyBase + shortid() + '.png';
                var params = {
                    Bucket: aws.bucket,
                    Key: key,
                    Body: file, ACL: 'public-read',
                    ContentType: 'image/png'
                };

                aws.s3.putObject(params, function (error, data) {
                    if (error) return reject(error);

                    var url = 'http://s3.amazonaws.com/' + aws.bucket + '/' + key;
                    return resolve(url);
                });
            })();
        } catch (error) {
            return reject(error);
        }
    });
};

var processAttachments = function processAttachments(attachments) {
    return Promise.all(attachments.map(function (attachment) {
        if (!attachment.image_url) return Promise.resolve(attachment);

        return uploadFile(attachment.image_url, awsConfig).then(function (url) {
            return _extends({}, attachment, {
                image_url: url
            });
        })['catch'](function (error) {
            console.log(error);
            delete attachment.image_url;
            return attachment;
        });
    }));
};

module.exports = {
    uploadFile: uploadFile,
    processAttachments: processAttachments
};