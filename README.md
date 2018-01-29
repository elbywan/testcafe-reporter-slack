# TestCafe Reporter Slack
### testcafe-reporter-slack

This is a reporter for [TestCafe](http://devexpress.github.io/testcafe). It sends the output of the test to slack.

## Purpose

Once configured the repoter sends test results to Slack depending on a .env file from the folder the tests are run from.

**This fork also uploads any screenshot taken by testcafe on failure to AWS S3 (by default - can be configured to upload to any online service) and posts the screenshots to Slack alongside the error message.**

## Setup instructions
Follow the instructions bellow to configure this plugin.

```bash
npm i -D testcafe-reporter-slack-image-fork
```

## Testing
Running TestCafe with testcafe-reporter-slack.

In order to use this TestCafe reporter plugin it is necessary to define .env variables in your test project, hence the folder from where your call TestCafe.

- cd into your test project.
- Edit or create the .env file by adding the following ki-reporter required variables:

```bash
TESTCAFE_SLACK_WEBHOOK=https://hooks.slack.com/services/*****
TESTCAFE_SLACK_CHANNEL='#testcafe'
TESTCAFE_SLACK_BOT=testcafebot
```

*Quiet mode*

Outputs to slack only on errors.

```bash
TESTCAFE_SLACK_QUIET=true
```

--------

**If you are using the default AWS S3 uploader**

- configure your ~/.aws/credentials [(documentation link)](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html)
- add the following environment variables :

```bash
TESTCAFE_SLACK_UPLOADER_AWS_PROFILE='profile'   # [default: 'default']
TESTCAFE_SLACK_UPLOADER_S3_BUCKET='bucket name' # [default: 'bucket']
TESTCAFE_SLACK_UPLOADER_S3_KEY='key prefix'     # [default: ''] (a generated id will be appended along with the .png extension)
```

**To use a custom uploader file**

Create a .js file which export a method with the following signature.

```typescript
type Attachment = { color: String, text: String, image_url: String }

// The attachments that the function receive as an argument contain a image_url property.
// It is the absolute path to the local file where testcafe stores the screenshot taken when a test fails.

// Replace the image_url with the real url of the image stored by whatever online service you choose.
// And then return the modified attachments in the promise.

(attachments: Attachment[]) => Promise<Attachment[]>
```

Then set an environment variable set with the path to your file.

```bash
TESTCAFE_SLACK_UPLOADER_PATH='/path/to/your/custom/js/uploader/file.js'
```

--------

Now run your tests from the commmand line with the ki-reporter specified, e.g.:

```
$ testcafe chrome 'path/to/test/file.js' --reporter slack-image-fork
```

When you use TestCafe API, you can pass the reporter name to the `reporter()` method:

```js
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('chrome')
    .reporter('slack') // <-
    .run();
```

## Further Documentation
[TestCafe Reporter Plugins](https://devexpress.github.io/testcafe/documentation/extending-testcafe/reporter-plugin/)
