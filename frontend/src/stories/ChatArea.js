import React, { useState } from 'react';
import classNames from 'classnames';
import { ChatBox, Composer, Avatar, Button, Icon, Dropdown, Overlay, Tooltip } from '@gotitinc/design-system';

function ChatMessage({
  nameColorClass,
  isPinned,
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="u-flex u-marginBottomExtraSmall u-paddingRightMedium u-positionRelative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="u-flexShrink-0 u-marginRightExtraSmall">
        <Avatar src={require('../assets/images/kid-boy.png')} />
      </div>
      <div className="u-flexGrow-1 u-text200 u-marginTopTiny u-textWordBreak">
        <span
          className={classNames(
            'u-fontBold u-marginRightExtraSmall',
            nameColorClass ? nameColorClass : 'u-textLight',
          )}
        >
          John Doe
        </span>
        <span className="">Lorem ipsum Lorem</span>
      </div>
      {!isPinned && hover && (
        <div className="u-positionAbsolute u-positionRight u-positionTop">
          <Dropdown alignRight>
            <Dropdown.Toggle className="u-textLight hover:u-textGray u-lineHeightNone u-rotate90">
              <Icon
                size="extraSmall"
                name="more"
              />
            </Dropdown.Toggle>
            <Dropdown.Container
              className="u-paddingVerticalExtraSmall"
              additionalStyles={{ minWidth: 150 }}
            >
              <Dropdown.Item className="u-cursorPointer u-alignItemsCenter" role="button" onClick={() => {}}>
                <Icon name="flag" size="extraSmall" />
                <span className="u-marginLeftExtraSmall u-text200 u-textNoWrap">Báo cáo vi phạm</span>
              </Dropdown.Item>
            </Dropdown.Container>
          </Dropdown>
        </div>
      )}
      {isPinned && (
        <div className="u-positionAbsolute u-positionRight u-positionTop">
          <Icon
            size="small"
            name="pin"
            className="u-cursorPointer u-textNegative u-opacityThreeQuarter hover:u-opacityReset u-lineHeightNone u-rotate45"
          />
        </div>
      )}
    </div>
  );
}

const ChatArea = ({ className }) => (
  <div className="u-flex u-flexColumn u-flexGrow-1">
    <div className="u-backgroundWhite u-borderTop u-borderLeft u-borderRight u-paddingExtraSmall u-text200 u-flex u-flexRow">
      <div className="u-flexGrow-1">
        <div>
          <span>Số người đang chat:&nbsp;</span>
          <span className="u-fontMedium">2401</span>
        </div>
        <div>
          <span>Số phòng chat:&nbsp;</span>
          <span className="u-fontMedium">1</span>
        </div>
        <div>
          <span>Phòng chat hiện tại:&nbsp;</span>
          <span className="u-fontMedium">1</span>
        </div>
      </div>
      <div className="u-flexShrink-0 u-flex u-alignItemsCenter u-justifyContentCenter">
        <Dropdown alignRight>
          <Dropdown.Button onlyIcon variant="positive_outline" className="u-roundedCircle u-marginRightExtraSmall is-disabled">
            <Button.Icon><Icon name="raiseHand"/></Button.Icon>
          </Dropdown.Button>
          <Dropdown.Container className="u-overflowHidden u-borderNone">
            <div 
              className="u-paddingExtraSmall u-backgroundBlack u-textWhite"
            >
              Chức năng giơ tay sẽ được cập nhật trong các phiên bản sau!
            </div>
          </Dropdown.Container>
        </Dropdown>

        <Overlay.Trigger
          key="bottom"
          placement="bottom"
          hoverOverlay
          delay={{ show: 0, hide: 100 }}
          overlay={props => (
            <Tooltip id="tooltip-change-room" {...props}>
              Chuyển sang phòng chat khác
            </Tooltip>
          )}
        >
          <Button onlyIcon variant="accent_outline" className="u-roundedCircle">
            <Button.Icon><Icon name="arrowForward"/></Button.Icon>
          </Button>
        </Overlay.Trigger>
      </div>
    </div>
    <ChatBox className="u-border u-backgroundWhite">
      <div className="u-paddingExtraSmall">
        <ChatMessage isPinned />
      </div>
      <ChatBox.List>
        <ChatMessage />
        <ChatMessage />
        <ChatMessage />
        <ChatMessage />
        <ChatMessage />
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
  </div>
);

export default ChatArea;
