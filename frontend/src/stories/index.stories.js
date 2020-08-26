import React, { useState } from 'react';
import { PageLayout, Modal, Button } from '@gotitinc/design-system';
import SplitPane from 'react-split-pane';
import ChatArea from './ChatArea';
import HeaderUI from './HeaderUI';

export default {
  title: 'Index',
};

function MainPage({
  loggedIn,
}) {
  const [show, setShow] = useState(true);

  return (
    <PageLayout
      style={{
        height: '100vh',
      }}
    >
      <PageLayout.Header className="u-borderBottom">
        <HeaderUI loggedIn={loggedIn} />
      </PageLayout.Header>
      <PageLayout.Body className="u-overflowVerticalAuto u-webkitScrollbar">
        <div className="Container Container--fluid u-paddingTopMedium u-paddingBottomSmall u-flex u-flexColumn u-backgroundOpaline">
          <div className="Grid Grid--smallGutter u-flexGrow-1">
            <div className="u-size9of12">
              <iframe width="100%" height="100%" src="https://www.youtube.com/embed/RK1K2bCg4J8" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
            <div className="u-size3of12 u-flex u-positionRelative">
              {loggedIn && show && (
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
                        <Button variant="primary" width="full">Chuyển phòng</Button>
                      </Modal.Footer>
                    </Modal>
                  </div>
                </div>
              )}
              <ChatArea />
            </div>
          </div>
        </div>
      </PageLayout.Body>
    </PageLayout>
  );
}

export const notLoggedIn = () => (
  <MainPage loggedIn={false} />
);

export const loggedIn = () => (
  <MainPage loggedIn={true} />
);
