import React from "react";
//@ts-ignore
import { Button, Icon, Dropdown, Overlay, Tooltip, Modal } from '@gotitinc/design-system';

export default function FunctionButtonGroup({ isSignedIn }: {isSignedIn: boolean }) {
  const [show, setShow] = React.useState(false);

  const onSwitchRoomConfirm = () => {
    // Start timer after successful room change
    console.log('confirmed');
  }

  return (
    <React.Fragment>
      {isSignedIn && show && (
        <div className="u-positionAbsolute u-positionFull u-zIndexModal u-flex u-flexGrow-1 u-alignItemsCenter u-justifyContentCenter">
          <div className="Modal-backDrop u-positionAbsolute u-positionFull u-backgroundBlack u-zIndex2 Show "/>
          <div className="u-positionRelative u-zIndex3 u-marginMedium">
            <Modal size="small" relative>
              <Modal.Header closeButton onHide={() => setShow(false)}/>
              <Modal.Body>
                <div className="u-textCenter">
                  Chỉ được chuyển phòng tối đa 1 lần trong 5 phút. Bạn chắc chắn muốn chuyển phòng chứ?
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="primary" width="full" onClick={onSwitchRoomConfirm}>Chuyển phòng</Button>
              </Modal.Footer>
            </Modal>
          </div>
        </div>
      )}
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
          overlay={(props: Object) => (
            <Tooltip id="tooltip-change-room" {...props}>
              Chuyển sang phòng chat khác
            </Tooltip>
          )}
        >
          <Button onlyIcon variant="primary_outline" className="u-roundedCircle" onClick={() => setShow(true)}>
            <Button.Icon><Icon name="arrowForward"/></Button.Icon>
          </Button>
        </Overlay.Trigger>
      </div>
    </React.Fragment>
  );
}
