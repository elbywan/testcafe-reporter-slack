'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

require('dotenv').config();
var env = process.env;

var _require = require(env['TESTCAFE_SLACK_UPLOADER_PATH'] || './uploader');

var processAttachments = _require.processAttachments;

var slackNode = require('slack-node');

var slack = new slackNode();
slack.setWebhook(env['TESTCAFE_SLACK_WEBHOOK'] || 'http://example.com');

var message = [];
var errorMessage = [];
var attachments = [];

var sendMessage = function sendMessage(message, slackProperties, exit) {
    if (slackProperties === undefined) slackProperties = null;

    slack.webhook(_extends({
        channel: env['TESTCAFE_SLACK_CHANNEL'] || '#testcafe',
        username: env['TESTCAFE_SLACK_BOT'] || 'testcafebot',
        text: message
    }, slackProperties), function (err, response) {
        if (err) {
            console.log('Unable to send a message to slack');
            console.log(response);
            if (exit) process.exit(1);
        } else {
            console.log('The following message is sent to slack: \n ' + message);
            if (exit) process.exit(0);
        }
    });
};

var sendReport = function sendReport(nrFailedTests) {
    processAttachments(attachments).then(function (uploadedAttachments) {
        var slackProperties = nrFailedTests === 0 ? null : {
            "attachments": [].concat(_toConsumableArray(uploadedAttachments))
        };
        sendMessage(message.join("\n"), slackProperties, true);
    })['catch'](function (error) {
        console.error(error);
        process.exit(1);
    });
};

process.on('message', function (_ref) {
    var action = _ref.action;
    var data = _ref.data;

    switch (action) {
        case 'addMessage':
            message.push(data);
            break;
        case 'addError':
            attachments.push({
                color: 'danger',
                text: '```' + data.message + '```',
                image_url: data.screenshotPath
            });
            break;
        case 'sendMessage':
            sendMessage(data);
            break;
        case 'sendReport':
            sendReport(data);
            break;
        case 'exit':
            process.exit;
    }
});