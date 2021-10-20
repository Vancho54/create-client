const DYNAMODB = require('aws-sdk/clients/dynamodb');
const SNS = require('aws-sdk/clients/sns');

const dynamoDb = new DYNAMODB({ region: 'us-east-2' });
const sns = new SNS({ region: 'us-east-2' });

const generateMsg = (args) => {
    const result = {
        TopicArn: process.env.TOPIC_ARN,
        Message: JSON.stringify(args)
    }
    return result;
}

const calculateAge = (date) => {
    const currentDate = new Date();
    const birthDay = new Date(date);
    const alreadyBirthday = currentDate.getMonth() - birthDay.getMonth()
    const age = currentDate.getFullYear() - birthDay.getFullYear();
    if (alreadyBirthday < 0 || (alreadyBirthday === 0 && currentDate.getTime() < birthDay.getTime())) {
        age--;
    }
    return age;
}

exports.handler = async (event) => {
    const response = {
        statusCode: 200,
        body: '',
    };
    try {
        const age = calculateAge(event.birthday);
        if (age < 18 || age > 65) throw new Error('You can not have a credit card! Sorry')
        const params = {
            TableName: 'IvanPalacios-ClientDB',
            Item: {
                DNI: event.dni,
                name: event.name,
                lastName: event.lastName,
                birthday: event.birthday
            }
        };
        await dynamoDb.putItem(params).promise();
        const msgJson = {
            age,
            DNI
        }
        const snsParams = generateMsg(msgJson)
        await sns.publish(snsParams).promise()
        response.body = 'We are generating your credit card! Thank you so much!'
    } catch (error) {
        response.statusCode = 400;
        response.body = error.messsage;
    }
    return response;
}