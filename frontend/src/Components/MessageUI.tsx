import React from "react";

import {
  Avatar,
  Icon,
  Dropdown,
  //@ts-ignore
} from "@gotitinc/design-system";
//@ts-ignore
import classNames from "classnames";
import { useUserData } from "../Hooks/User";
import { useSocket } from "../Hooks/Socket";

export function UserMessageUI({
  username,
  message,
  messageId,
  message_type,
}: {
  username: string;
  message: string;
  messageId: string;
  message_type: string;
}) {
  const [hover, setHover] = React.useState(false);
  const userData = useUserData();
  const socket = useSocket();

  const handleDeleteMessage = (e: any) => {
    if (!socket) return;

    socket.emit("delete_message", messageId);
  };

  const handleReportUser = (username: string) => {
    if (!socket) return;

    socket.emit("report", username);
  };

  return (
    <div
      className="u-flex u-marginBottomExtraSmall u-paddingRightMedium u-positionRelative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="u-flexShrink-0 u-marginRightExtraSmall">
        <Avatar src={require("../assets/images/kid-boy.png")} />
      </div>
      <div className="u-flexGrow-1 u-text200 u-marginTopTiny u-textWordBreak">
        <span
          className={classNames(
            "u-fontBold u-marginRightExtraSmall u-textLight"
          )}
        >
          {username}
        </span>
        <span
          className={classNames(message_type === "global" && "u-textWarning")}
        >
          {message}
        </span>
      </div>
      {hover && (
        <div className="u-positionAbsolute u-positionRight u-positionTop">
          <Dropdown alignRight>
            <Dropdown.Toggle className="u-textLight hover:u-textGray u-lineHeightNone u-rotate90">
              <Icon size="extraSmall" name="more" />
            </Dropdown.Toggle>
            <Dropdown.Container
              className="u-paddingVerticalExtraSmall"
              additionalStyles={{ minWidth: 150 }}
            >
              <Dropdown.Item
                className="u-cursorPointer u-alignItemsCenter"
                role="button"
                onClick={() => handleReportUser(username)}
              >
                <Icon name="flag" size="extraSmall" />
                <span className="u-marginLeftExtraSmall u-text200 u-textNoWrap">
                  Báo cáo vi phạm
                </span>
              </Dropdown.Item>
              {userData?.role === 0 && (
                <Dropdown.Item
                  className="u-cursorPointer u-alignItemsCenter"
                  role="button"
                >
                  <Icon name="closeCircleOutline" size="extraSmall" />
                  <span
                    onClick={handleDeleteMessage}
                    className="u-marginLeftExtraSmall u-text200 u-textNoWrap"
                  >
                    Xoá tin nhắn
                  </span>
                </Dropdown.Item>
              )}
            </Dropdown.Container>
          </Dropdown>
        </div>
      )}
    </div>
  );
}

export function SystemMessageUI({
  message,
  type,
}: {
  message: string | null | undefined;
  type: string | null | undefined;
}) {
  return (
    <div
      className={classNames(
        "u-text200 u-fontItalic u-marginBottomExtraSmall",
        type === "info" && "u-textLight",
        type === "error" && "u-textNegative"
      )}
    >
      {message}
    </div>
  );
}
