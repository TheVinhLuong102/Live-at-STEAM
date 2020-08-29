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
          <div className="u-fontMedium u-text500">Bài học số 1:</div>
          <div className="u-marginHorizontalTiny u-textGray u-text500">Cá nướng của Miu đâu rồi?</div>
          <div><Badge variant="primary_subtle">{chatAnalytics.numUsers} người đang xem </Badge></div>
        </Header.Left>
        <Header.Right>
          <Login/>
        </Header.Right>
      </Header.Main>
    </Header>
  );
}
