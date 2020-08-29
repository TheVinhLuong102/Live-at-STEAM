import React from "react";
import Linkify from "react-linkify";

import {
  Avatar,
  Icon,
  Dropdown,
  Badge,
  //@ts-ignore
} from "@gotitinc/design-system";
//@ts-ignore
import classNames from "classnames";
import { useUserData } from "../Hooks/User";
import { useSocket } from "../Hooks/Socket";
import DropdownWrapper from "./DropdownWrapper";
import { getShortName, chooseColorByString } from "../Utils/Common";
import {NewMessagePayload} from "../Types/Common";

export function UserMessageUI({
  username,
  role,
  message,
  messageId,
  type,
  socket,
}: {
  socket: SocketIOClient.Socket | null | undefined;
} & NewMessagePayload) {
  const [hover, setHover] = React.useState(false);
  const userData = useUserData();

  const handleDeleteMessage = () => {
    socket?.emit("delete_message", messageId);
  };

  const handleReportUser = (username: string) => {
    socket?.emit("report", username);
  };

  const handleBanUser = (username: string) => {
    socket?.emit("ban_user", username);
  };

  return (
    <div
      className="u-flex u-marginBottomExtraSmall u-paddingRightMedium u-positionRelative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="u-flexShrink-0 u-marginRightExtraSmall">
        {/* <Avatar src={require("../assets/images/kid-boy.png")} /> */}
        <Avatar
          className={classNames(
            "u-text200 u-textUppercase",
            chooseColorByString(username)
          )}
          text={getShortName(username)}
        />
      </div>
      <div className="u-flexGrow-1 u-text200 u-marginTopTiny u-textWordBreak">
        <span className={classNames("u-fontBold u-textLight " + ( role === 0 && "u-textPositive"))}>{username}</span>
        {type === "global" && (
          <Badge
            variant="positive"
            className="u-marginLeftTiny u-fontRegular u-text100"
          >
            Thông báo
          </Badge>
        )}
        <span
          className={classNames(
            "u-marginLeftExtraSmall",
            type === "global" && "u-textPositive"
          )}
        >
          <Linkify
            componentDecorator={(href, text, key) => (
              <a href={href} key={key} target="_blank">
                {text}
              </a>
            )}
          >
            {message}
          </Linkify>
        </span>
      </div>
      {hover && (
        <div className="u-positionAbsolute u-positionRight u-positionTop">
          <DropdownWrapper
            renderer={(showDropdown: boolean, setShowDropdown: Function) => (
              <Dropdown
                alignRight
                onToggle={() => setShowDropdown(!showDropdown)}
                show={showDropdown}
              >
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
                    onClick={() => {
                      handleReportUser(username);
                      setShowDropdown(false);
                    }}
                  >
                    <Icon name="flag" size="extraSmall" />
                    <span className="u-marginLeftExtraSmall u-text200 u-textNoWrap">
                      Báo cáo vi phạm
                    </span>
                  </Dropdown.Item>
                  {userData?.role === 0 && [
                    <Dropdown.Item
                      className="u-cursorPointer u-alignItemsCenter"
                      role="button"
                      onClick={() => {
                        handleDeleteMessage();
                        setShowDropdown(false);
                      }}
                    >
                      <Icon name="trash" size="extraSmall" />
                      <span className="u-marginLeftExtraSmall u-text200 u-textNoWrap">
                        Xoá tin nhắn
                      </span>
                    </Dropdown.Item>,
                    <Dropdown.Item
                      className="u-cursorPointer u-alignItemsCenter"
                      role="button"
                      onClick={() => {
                        handleBanUser(username);
                        setShowDropdown(false);
                      }}
                    >
                      <Icon name="micOff" size="extraSmall" />
                      <span className="u-marginLeftExtraSmall u-text200 u-textNoWrap">
                        Cấm chat
                      </span>
                    </Dropdown.Item>,
                  ]}
                </Dropdown.Container>
              </Dropdown>
            )}
          />
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
        "u-text100 u-fontItalic u-marginBottomExtraSmall",
        type === "info" && "u-textLight",
        type === "error" && "u-textNegative"
      )}
    >
      {message}
    </div>
  );
}
