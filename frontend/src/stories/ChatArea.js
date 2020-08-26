import React from 'react';
import { ChatBox, BubbleChat,Composer,Avatar } from '@gotitinc/design-system';
const ChatArea = ({ className}) => (
  <ChatBox className="u-border">
    <ChatBox.List>
      <BubbleChat
        text="File attachment message"
        type="outbound"
        avatar={()=> <Avatar src={require('../assets/images/kid-boy.png')} />}
        time="11:32"
      />

      <BubbleChat
        text="File attachment message"
        type="inbound"
        avatar={()=> <Avatar src={require('../assets/images/kid-boy.png')} />}
        time="11:33"
      />
       <BubbleChat
        isTyping
        type="inbound"
        avatar={()=> <Avatar src={require('../assets/images/kid-boy.png')} />}
        time="11:33"
      />
    </ChatBox.List>
    <ChatBox.Context>
      <Composer
        disabledAttachButton
        disabledSendButton={false}
        sendButtonActive
        inputProps={{
          placeholder: 'Write your message...',
          maxRows: 4,
        }}
      />
    </ChatBox.Context>
  </ChatBox>
);

export default ChatArea;
