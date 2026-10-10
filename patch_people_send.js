const fs = require('fs');
const file = 'src/services/PeopleService.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  `    // Store locally in conversation immediately
    this.addMessageToConversation(targetPeerId, messageDto);`,
  `    // Store locally in conversation immediately
    (messageDto as any)._local_delivery_state = 'QUEUED';
    this.addMessageToConversation(targetPeerId, messageDto);`
);
content = content.replace(
  `    // Broadcast / send via NetworkEngine
    const sendRes = await this.networkEngine.send(messageDto);
    if (!sendRes.ok) {
      return {
        ok: false,
        error: sendRes.error,
      };
    }

    return { ok: true, data: messageDto };`,
  `    // Broadcast / send via NetworkEngine
    const sendRes = await this.networkEngine.send(messageDto);
    if (!sendRes.ok) {
      (messageDto as any)._local_delivery_state = 'FAILED';
      this.notifyMessageListeners(targetPeerId, messageDto);
      return {
        ok: false,
        error: sendRes.error,
      };
    }

    (messageDto as any)._local_delivery_state = 'SENT';
    this.notifyMessageListeners(targetPeerId, messageDto);
    return { ok: true, data: messageDto };`
);
fs.writeFileSync(file, content);
