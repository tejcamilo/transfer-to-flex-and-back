const Response = (callback, xml) => {
    const response = new Twilio.Response();
    response.appendHeader('Content-Type', 'application/xml');
    response.setBody(xml.trim());
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST GET');
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
    callback(null, response);
    console.log('response: ', xml.trim());
};

exports.handler = async (context, event, callback) => {

    console.log('event', event);

    const { ACCOUNT_SID, PATH, DOMAIN_NAME, STUDIO_FLOW_SID, WORKFLOW_SID } = context;
    const { CallSid, transferToIVRMenu } = event;

    const studioFlowSid = STUDIO_FLOW_SID;
    const taskRouterWorkflow = WORKFLOW_SID;

    //
    // Request came from Studio Flow to forward the call to Flex
    //
    if (!transferToIVRMenu) {
        console.log('Step 1 - Sending call to Flex...');

        const url = `https://${DOMAIN_NAME}${PATH}`;

        return Response(
            callback,
            `
            <?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Enqueue workflowSid="${taskRouterWorkflow}">
                    <Task>{"transferToIvrUrl": "${url}"}</Task>
                </Enqueue>     
            </Response>
        `
        );
    }

    //
    // Request came from Flex to forward the call back to Studio
    //
    console.log('Step 2 - Sending call from Flex back to Studio...');

    const twiml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Redirect>https://webhooks.twilio.com/v1/Accounts/${ACCOUNT_SID}/Flows/${studioFlowSid}?FlowEvent=return&amp;transferToIVRMenu=${transferToIVRMenu}</Redirect>
        </Response>
    `.trim();

    console.log('CallSid', CallSid);
    console.log('twiml', twiml);
    const client = context.getTwilioClient();
    await client.calls(CallSid).update({ twiml });
    return Response(callback, twiml);
};