import React from 'react';
import { PageLayout,Header,Media, Logo, SafeAnchor,Badge, Button } from '@gotitinc/design-system';
import SplitPane from 'react-split-pane';
import ChatArea from './ChatArea';

export default {
  title: 'Index',
};

export const index = () => (
  <PageLayout style={{
    height: '100vh',
  }}
  >
    <PageLayout.Header className="u-borderBottom">
      <Header fullWidth>
        <Header.Brand>
          <Logo as={SafeAnchor} src={require('../assets/images/logo.svg')} height={42} />
        </Header.Brand>
        <Header.Main>
          <Header.Left className="u-alignItemsCenter">
            <div className="u-fontMedium u-text500">Bài học số 1:</div>
            <div className="u-marginHorizontalTiny u-textGray u-text500">Cá nướng của Miu đâu rồi?</div>
            <div><Badge variant="primary_subtle">256 người đang xem </Badge></div>
          </Header.Left>
          <Header.Right>
            <Button variant="accent" width="min">
              <Button.Label className="u-textDark">Login</Button.Label>
            </Button>
          </Header.Right>
        </Header.Main>
      </Header>
    </PageLayout.Header>
    <PageLayout.Body className="u-overflowVerticalAuto u-webkitScrollbar">
      <div className="Container Container--fluid u-paddingTopMedium u-paddingBottomSmall u-flex u-flexColumn u-backgroundOpaline">
        <div className="Grid Grid--smallGutter u-flexGrow-1">
          <div className="u-size9of12">
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/RK1K2bCg4J8" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
          <div className="u-size3of12 u-flex">
            <ChatArea />
          </div>
        </div>
      </div>
    </PageLayout.Body>
  </PageLayout>
)
