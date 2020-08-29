import React from 'react';
import { Header, Logo, SafeAnchor,Badge, Button, Dropdown, Icon, Form } from '@gotitinc/design-system';
import { linkTo } from '@storybook/addon-links';

function HeaderUI({
  loggedIn,
}) {
  return (
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
          {loggedIn ? (
            <React.Fragment>
              <div className="u-marginRightExtraSmall">John Doe</div>
              <Dropdown alignRight id="profile">
                <Dropdown.Toggle className="u-textLight u-lineHeightNone">
                  <Icon name="contact" size="medium" />
                </Dropdown.Toggle>
                <Dropdown.Container className="u-paddingVerticalExtraSmall">
                  <Dropdown.Item role="button" onClick={() => {}} id="header-logout-button">
                    <Icon name="power" size="small" />
                    <span className="u-marginLeftExtraSmall">Đăng xuất</span>
                  </Dropdown.Item>
                </Dropdown.Container>
              </Dropdown>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Form.Input
                type="text"
                placeholder="Tên đăng nhập"
                className="u-marginRightExtraSmall"
              />
              <Form.Input
                type="password"
                placeholder="Mật khẩu"
                className="u-marginRightExtraSmall"
              />
              <Button variant="accent" onClick={linkTo('index--logged-in')}>
                <Button.Label className="u-textDark u-textNoWrap">Đăng nhập</Button.Label>
              </Button>
            </React.Fragment>
          )}
        </Header.Right>
      </Header.Main>
    </Header>
  );
};

export default HeaderUI;
