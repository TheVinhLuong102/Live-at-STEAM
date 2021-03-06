import React from "react";
//@ts-ignore
import {
  Button,
  Icon,
  Dropdown,
  Overlay,
  Tooltip,
  Modal,
//@ts-ignore
} from "@gotitinc/design-system";
import { UserData } from "../Types/User";
import { useSocket } from "../Hooks/Socket";
import { useChatAnalytics } from "../Hooks/Analytics";
import DropdownWrapper from './DropdownWrapper';

export default function FunctionButtonGroup({
  isSignedIn,
  isAdmin,
  socket
}: {
  isSignedIn: boolean;
  isAdmin: boolean;
  socket: SocketIOClient.Socket | null | undefined
}) {
  const [show, setShow] = React.useState(false);
  const chatAnalytics = useChatAnalytics();

  const onSwitchRandomRoom = () => {
    socket?.emit("join_random_room");
  }

  const onSwitchRoom = (roomName: string) => {
    socket?.emit("join_room", roomName);
  };

  return (
    <React.Fragment>
      {isSignedIn && show && (
        <div className="u-positionAbsolute u-positionFull u-zIndexModal u-flex u-flexGrow-1 u-alignItemsCenter u-justifyContentCenter">
          <div className="Modal-backDrop u-positionAbsolute u-positionFull u-backgroundBlack u-zIndex2 Show" />
          <div className="u-positionRelative u-zIndex3 u-marginMedium">
            <Modal size="small" relative>
              <Modal.Header closeButton onHide={() => setShow(false)} />
              <Modal.Body>
                <div className="u-textCenter">
                  Chỉ được chuyển phòng tối đa 1 lần trong 5 phút. Bạn chắc chắn
                  muốn chuyển phòng chứ?
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="primary"
                  width="full"
                  onClick={() => {
                    onSwitchRandomRoom();
                    setShow(false);
                  }}
                >
                  Chuyển phòng
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </div>
      )}
      <div className="u-flexShrink-0 u-flex u-alignItemsCenter u-justifyContentCenter">
        {!isAdmin && (
          <Dropdown alignRight>
            <Dropdown.Button
              onlyIcon
              variant="positive_outline"
              className="u-roundedCircle u-marginRightExtraSmall is-disabled"
            >
              <Button.Icon>
                <Icon name="raiseHand" />
              </Button.Icon>
            </Dropdown.Button>
            <Dropdown.Container className="u-overflowHidden u-borderNone">
              <div className="u-paddingExtraSmall u-backgroundBlack u-textWhite">
                Chức năng giơ tay sẽ được cập nhật trong các phiên bản sau!
              </div>
            </Dropdown.Container>
          </Dropdown>
        )}

        {isAdmin && (
          <DropdownWrapper
            renderer={(showDropdown: boolean, setShowDropdown: Function) => (
              <Dropdown
                alignRight
                onToggle={() => {
                  setShowDropdown(!showDropdown);
                }}
                show={showDropdown}
              >
                <Overlay.Trigger
                  key="bottom"
                  placement="top"
                  hoverOverlay
                  delay={{ show: 0, hide: 1 }}
                  overlay={(props: Object) => (
                    <Tooltip id="tooltip-choose-room" {...props}>
                      Chọn phòng chat
                    </Tooltip>
                  )}
                >
                  <Dropdown.Button onlyIcon variant="primary" className="u-roundedCircle u-marginRightExtraSmall">
                    <Button.Icon><Icon name="people"/></Button.Icon>
                  </Dropdown.Button>
                </Overlay.Trigger>
                <Dropdown.Container className="u-paddingVerticalExtraSmall">
                  {chatAnalytics.rooms.map((r, i) => (
                    <Dropdown.Item
                      key={r.count}
                      onClick={() => {
                        onSwitchRoom(r.name);
                        setShowDropdown(false);
                      }}
                      className="u-cursorPointer"
                    >
                      <span className="u-marginLeftExtraSmall">{r.name} (Online: {r.count})</span>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Container>
              </Dropdown>
            )}
          />
        )}

        <Overlay.Trigger
          key="bottom"
          placement="top"
          hoverOverlay
          delay={{ show: 0, hide: 1 }}
          overlay={(props: Object) => (
            <Tooltip id="tooltip-change-room" {...props}>
              Chuyển phòng chat khác
            </Tooltip>
          )}
        >
          <Button
            onlyIcon
            variant="accent"
            className="u-roundedCircle"
            onClick={() => setShow(true)}
          >
            <Button.Icon>
              <Icon name="arrowForward" />
            </Button.Icon>
          </Button>
        </Overlay.Trigger>
      </div>
    </React.Fragment>
  );
}
