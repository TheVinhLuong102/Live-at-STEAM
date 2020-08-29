import React from "react";
//@ts-ignore
import { Header, Logo, SafeAnchor,Badge } from '@gotitinc/design-system';
import Login from "./Login";
import { useChatAnalytics } from "../Hooks/Analytics";

export default function NavBar() {
  const chatAnalytics = useChatAnalytics();
  return (
    <Header fullWidth>
      <Header.Brand>
        <Logo as={SafeAnchor} src={require('../assets/images/logo.svg')} height={42} />
      </Header.Brand>
      <Header.Main>
        <Header.Left className="u-alignItemsCenter">
          {/* TODO: get title from API */}
          <div className="u-fontMedium u-text500">Buổi học số 4:</div>
          <div className="u-marginLeftTiny u-textGray u-text500">Rắn bắt sao</div>
          <div className="u-marginLeftExtraSmall"><Badge variant="primary_subtle">{chatAnalytics.numUsers} người đang xem </Badge></div>
        </Header.Left>
        <Header.Right>
          <Login/>
        </Header.Right>
      </Header.Main>
    </Header>
  );
}
