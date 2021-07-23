import React, { useState, useEffect } from "react";
import { Typography, Paper, Switch, Button, SvgIcon, Grid } from "@material-ui/core";
import { withTheme } from "@material-ui/core/styles";
import { withStyles } from "@material-ui/core/styles";

import { useRouter } from "next/router";
import MenuIcon from "@material-ui/icons/Menu";
import CloseIcon from "@material-ui/icons/Close";
import WbSunnyOutlinedIcon from "@material-ui/icons/WbSunnyOutlined";
import Brightness2Icon from "@material-ui/icons/Brightness2";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";

import Unlock from "../unlock";

import stores from "../../stores";
import { formatAddress } from "../../utils";

import classes from "./navigation.module.css";
function YearnIcon(props) {
  const { color, className, width, height } = props;
  return (
    <SvgIcon
      viewBox="0 0 105 37"
      fill="none"
      width={width}
      height={height}
      className={className}
    >
      <path
        d="M8.14 14.88H13.82V9.32L21.78 0H15.56L11.14 5.14L6.8 0H0L8.14 9.28V14.88Z"
        fill={color}
      />
      <path
        d="M22.3366 0V14.88H38.9566V11.16H27.9366V9.12H38.5766V5.5H27.9366V3.64H38.7966V0H22.3366Z"
        fill={color}
      />
      <path
        d="M52.9373 8.76H47.9973L50.4373 3.64L52.9373 8.76ZM55.9173 14.88H62.1373L54.3573 0H46.7173L39.3573 14.88H45.1173L46.2573 12.48H54.7573L55.9173 14.88Z"
        fill={color}
      />
      <path
        d="M68.4658 3.62H74.9858C76.2658 3.62 76.7058 4.18 76.7058 4.88V4.9C76.7058 5.62 76.2458 6.18 74.9858 6.18H68.4658V3.62ZM68.4658 9.78H73.9058C76.1458 9.78 76.9258 10.66 76.9258 12.36V14.1C76.9258 14.52 76.9658 14.72 77.1058 14.88H82.9058V14.78C82.7658 14.52 82.6258 14.14 82.6258 13.1V10.9C82.6258 8.98 81.4058 7.78 79.5658 7.36C80.6858 7.1 82.5658 6.2 82.5658 4.04V3.82C82.5658 1.4 80.6458 0 76.3058 0H62.7858V14.88H68.4658V9.78Z"
        fill={color}
      />
      <path
        d="M84.192 0V14.88H89.832V5.86L99.152 14.88H104.832V0H99.192V8.46L90.552 0H84.192Z"
        fill={color}
      />
      <path
        d="M6.9 35.8807V30.1207H5.625V28.9807H6.9V28.0657C6.9 27.3157 7.115 26.7607 7.545 26.4007C7.985 26.0307 8.58 25.8457 9.33 25.8457H10.395V26.9857H9.45C9 26.9857 8.675 27.1007 8.475 27.3307C8.285 27.5507 8.19 27.8857 8.19 28.3357V28.9807H10.395V30.1207H8.19V35.8807H6.9Z"
        fill={color}
      />
      <path
        d="M20.7081 28.9807V35.8807H19.4181V28.9807H20.7081ZM19.3131 25.8457H20.8131V27.4057H19.3131V25.8457Z"
        fill={color}
      />
      <path
        d="M34.2531 28.7857C34.7231 28.7857 35.1431 28.8607 35.5131 29.0107C35.8931 29.1607 36.2081 29.3707 36.4581 29.6407C36.7181 29.9107 36.9131 30.2307 37.0431 30.6007C37.1831 30.9707 37.2531 31.3757 37.2531 31.8157V35.8807H35.9631V31.9207C35.9631 31.3507 35.8131 30.8857 35.5131 30.5257C35.2131 30.1657 34.7481 29.9857 34.1181 29.9857C33.8381 29.9857 33.5631 30.0407 33.2931 30.1507C33.0331 30.2507 32.8031 30.4007 32.6031 30.6007C32.4031 30.7907 32.2381 31.0307 32.1081 31.3207C31.9881 31.6107 31.9281 31.9357 31.9281 32.2957V35.8807H30.6381V28.9807H31.9281V29.7307C32.1581 29.4507 32.4681 29.2257 32.8581 29.0557C33.2481 28.8757 33.7131 28.7857 34.2531 28.7857Z"
        fill={color}
      />
      <path
        d="M49.7604 28.7857C50.2504 28.7857 50.6954 28.8457 51.0954 28.9657C51.5054 29.0857 51.8554 29.2607 52.1454 29.4907C52.4354 29.7207 52.6604 30.0057 52.8204 30.3457C52.9804 30.6757 53.0604 31.0557 53.0604 31.4857V35.8807H51.7704V35.1307C51.5004 35.4207 51.1654 35.6507 50.7654 35.8207C50.3754 35.9907 49.9104 36.0757 49.3704 36.0757C48.9604 36.0757 48.5854 36.0257 48.2454 35.9257C47.9054 35.8357 47.6104 35.6957 47.3604 35.5057C47.1104 35.3157 46.9154 35.0807 46.7754 34.8007C46.6354 34.5107 46.5654 34.1707 46.5654 33.7807C46.5654 33.3607 46.6454 33.0107 46.8054 32.7307C46.9754 32.4407 47.2004 32.2107 47.4804 32.0407C47.7604 31.8607 48.0804 31.7357 48.4404 31.6657C48.8104 31.5857 49.1954 31.5457 49.5954 31.5457H51.7704C51.7704 30.9757 51.5754 30.5757 51.1854 30.3457C50.8054 30.1057 50.3304 29.9857 49.7604 29.9857C49.3404 29.9857 48.9454 30.0707 48.5754 30.2407C48.2154 30.4107 47.9654 30.6607 47.8254 30.9907H46.4004C46.5004 30.6307 46.6554 30.3157 46.8654 30.0457C47.0854 29.7757 47.3404 29.5457 47.6304 29.3557C47.9304 29.1657 48.2604 29.0257 48.6204 28.9357C48.9804 28.8357 49.3604 28.7857 49.7604 28.7857ZM51.7704 32.6707H49.5804C49.0404 32.6707 48.6154 32.7607 48.3054 32.9407C48.0054 33.1207 47.8554 33.4007 47.8554 33.7807C47.8554 34.1607 48.0054 34.4407 48.3054 34.6207C48.6054 34.7907 49.0054 34.8757 49.5054 34.8757C50.2054 34.8757 50.7554 34.7157 51.1554 34.3957C51.5654 34.0657 51.7704 33.6407 51.7704 33.1207V32.6707Z"
        fill={color}
      />
      <path
        d="M66.4211 28.7857C66.8911 28.7857 67.3111 28.8607 67.6811 29.0107C68.0611 29.1607 68.3761 29.3707 68.6261 29.6407C68.8861 29.9107 69.0811 30.2307 69.2111 30.6007C69.3511 30.9707 69.4211 31.3757 69.4211 31.8157V35.8807H68.1311V31.9207C68.1311 31.3507 67.9811 30.8857 67.6811 30.5257C67.3811 30.1657 66.9161 29.9857 66.2861 29.9857C66.0061 29.9857 65.7311 30.0407 65.4611 30.1507C65.2011 30.2507 64.9711 30.4007 64.7711 30.6007C64.5711 30.7907 64.4061 31.0307 64.2761 31.3207C64.1561 31.6107 64.0961 31.9357 64.0961 32.2957V35.8807H62.8061V28.9807H64.0961V29.7307C64.3261 29.4507 64.6361 29.2257 65.0261 29.0557C65.4161 28.8757 65.8811 28.7857 66.4211 28.7857Z"
        fill={color}
      />
      <path
        d="M84.1634 30.9907C83.9834 30.6807 83.7334 30.4357 83.4134 30.2557C83.0934 30.0757 82.7284 29.9857 82.3184 29.9857C81.9784 29.9857 81.6684 30.0507 81.3884 30.1807C81.1084 30.3007 80.8634 30.4707 80.6534 30.6907C80.4534 30.9107 80.2934 31.1707 80.1734 31.4707C80.0634 31.7707 80.0084 32.0907 80.0084 32.4307C80.0084 32.7707 80.0634 33.0907 80.1734 33.3907C80.2934 33.6907 80.4534 33.9507 80.6534 34.1707C80.8634 34.3907 81.1084 34.5657 81.3884 34.6957C81.6684 34.8157 81.9784 34.8757 82.3184 34.8757C82.7284 34.8757 83.0934 34.7857 83.4134 34.6057C83.7334 34.4257 83.9834 34.1807 84.1634 33.8707H85.5734C85.3234 34.5407 84.9084 35.0757 84.3284 35.4757C83.7584 35.8757 83.0884 36.0757 82.3184 36.0757C81.8084 36.0757 81.3334 35.9857 80.8934 35.8057C80.4534 35.6157 80.0734 35.3607 79.7534 35.0407C79.4334 34.7107 79.1784 34.3257 78.9884 33.8857C78.8084 33.4357 78.7184 32.9507 78.7184 32.4307C78.7184 31.9107 78.8084 31.4307 78.9884 30.9907C79.1784 30.5407 79.4334 30.1557 79.7534 29.8357C80.0734 29.5057 80.4534 29.2507 80.8934 29.0707C81.3334 28.8807 81.8084 28.7857 82.3184 28.7857C83.0884 28.7857 83.7584 28.9857 84.3284 29.3857C84.9084 29.7857 85.3234 30.3207 85.5734 30.9907H84.1634Z"
        fill={color}
      />
      <path
        d="M98.1097 34.8757C98.5197 34.8757 98.8797 34.8007 99.1897 34.6507C99.5097 34.4907 99.7597 34.2557 99.9397 33.9457H101.335C101.095 34.6157 100.685 35.1407 100.105 35.5207C99.5347 35.8907 98.8697 36.0757 98.1097 36.0757C97.5897 36.0757 97.1097 35.9857 96.6697 35.8057C96.2297 35.6257 95.8447 35.3757 95.5147 35.0557C95.1947 34.7257 94.9447 34.3357 94.7647 33.8857C94.5847 33.4357 94.4947 32.9457 94.4947 32.4157C94.4947 31.8957 94.5797 31.4157 94.7497 30.9757C94.9297 30.5357 95.1747 30.1557 95.4847 29.8357C95.7947 29.5057 96.1647 29.2507 96.5947 29.0707C97.0347 28.8807 97.5147 28.7857 98.0347 28.7857C98.5247 28.7857 98.9747 28.8807 99.3847 29.0707C99.8047 29.2507 100.165 29.5007 100.465 29.8207C100.765 30.1407 101 30.5207 101.17 30.9607C101.34 31.3907 101.425 31.8507 101.425 32.3407C101.425 32.4207 101.425 32.5107 101.425 32.6107C101.425 32.7107 101.415 32.8107 101.395 32.9107H95.8297C95.8697 33.1907 95.9547 33.4507 96.0847 33.6907C96.2147 33.9307 96.3797 34.1407 96.5797 34.3207C96.7797 34.4907 97.0097 34.6257 97.2697 34.7257C97.5297 34.8257 97.8097 34.8757 98.1097 34.8757ZM98.0347 29.9857C97.4347 29.9857 96.9397 30.1507 96.5497 30.4807C96.1597 30.8107 95.9247 31.2457 95.8447 31.7857H100.075C99.9947 31.2457 99.7747 30.8107 99.4147 30.4807C99.0647 30.1507 98.6047 29.9857 98.0347 29.9857Z"
        fill={color}
      />
    </SvgIcon>
  );
}

function InvestIcon(props) {
  const { color, className } = props;
  return (
    <SvgIcon viewBox="0, 0, 24, 24" className={className}>
      <path
        fill={color}
        d="M4.99222 12.9844C4.77499 12.9842 4.5636 13.0547 4.39002 13.1853C4.21643 13.3159 4.09009 13.4994 4.0301 13.7082C3.97011 13.917 3.97973 14.1396 4.05752 14.3424C4.1353 14.5453 4.27701 14.7172 4.46122 14.8324L7.14922 17.5204C7.24213 17.6132 7.35241 17.6869 7.47378 17.7371C7.59515 17.7873 7.72522 17.8131 7.85657 17.8131C7.98792 17.813 8.11797 17.7871 8.2393 17.7368C8.36064 17.6865 8.47087 17.6128 8.56371 17.5199C8.65656 17.427 8.7302 17.3167 8.78042 17.1953C8.83064 17.0739 8.85646 16.9439 8.85642 16.8125C8.85637 16.6812 8.83045 16.5511 8.78015 16.4298C8.72984 16.3085 8.65613 16.1982 8.56322 16.1054L7.44222 14.9854H14.9922C15.2574 14.9854 15.5118 14.88 15.6993 14.6925C15.8869 14.5049 15.9922 14.2506 15.9922 13.9854C15.9922 13.7202 15.8869 13.4658 15.6993 13.2783C15.5118 13.0907 15.2574 12.9854 14.9922 12.9854H4.99222V12.9844Z"
      />
      <path
        fill={color}
        d="M19.0054 11.0162C19.2226 11.0164 19.434 10.9459 19.6076 10.8153C19.7812 10.6847 19.9075 10.5011 19.9675 10.2924C20.0275 10.0836 20.0178 9.86096 19.9401 9.65813C19.8623 9.45531 19.7206 9.28333 19.5364 9.1682L16.8484 6.4802C16.6607 6.29269 16.4063 6.18741 16.141 6.1875C15.8757 6.18759 15.6214 6.29306 15.4339 6.4807C15.2464 6.66834 15.1411 6.92279 15.1412 7.18806C15.1413 7.45333 15.2467 7.70769 15.4344 7.8952L16.5554 9.0152H9.00537C8.74015 9.0152 8.4858 9.12056 8.29826 9.3081C8.11073 9.49563 8.00537 9.74999 8.00537 10.0152C8.00537 10.2804 8.11073 10.5348 8.29826 10.7223C8.4858 10.9098 8.74015 11.0152 9.00537 11.0152H19.0054V11.0162Z"
      />
    </SvgIcon>
  );
}

function InvestIconSelected(props) {
  const { color, altColor, className } = props;
  return (
    <SvgIcon viewBox="0, 0, 48, 48" className={className}>
      <rect width="48" height="48" rx="24" fill={color} />
      <path
        fill={altColor}
        d="M16.9922 24.9844C16.775 24.9842 16.5636 25.0547 16.39 25.1853C16.2164 25.3159 16.0901 25.4994 16.0301 25.7082C15.9701 25.917 15.9797 26.1396 16.0575 26.3424C16.1353 26.5453 16.277 26.7172 16.4612 26.8324L19.1492 29.5204C19.2421 29.6132 19.3524 29.6869 19.4738 29.7371C19.5951 29.7873 19.7252 29.8131 19.8566 29.8131C19.9879 29.813 20.118 29.7871 20.2393 29.7368C20.3606 29.6865 20.4709 29.6128 20.5637 29.5199C20.6566 29.427 20.7302 29.3167 20.7804 29.1953C20.8306 29.0739 20.8565 28.9439 20.8564 28.8125C20.8564 28.6812 20.8305 28.5511 20.7801 28.4298C20.7298 28.3085 20.6561 28.1982 20.5632 28.1054L19.4422 26.9854H26.9922C27.2574 26.9854 27.5118 26.88 27.6993 26.6925C27.8869 26.5049 27.9922 26.2506 27.9922 25.9854C27.9922 25.7202 27.8869 25.4658 27.6993 25.2783C27.5118 25.0907 27.2574 24.9854 26.9922 24.9854H16.9922V24.9844Z"
      />
      <path
        fill={altColor}
        d="M31.0054 23.0162C31.2226 23.0164 31.434 22.9459 31.6076 22.8153C31.7812 22.6847 31.9075 22.5011 31.9675 22.2924C32.0275 22.0836 32.0178 21.861 31.9401 21.6581C31.8623 21.4553 31.7206 21.2833 31.5364 21.1682L28.8484 18.4802C28.6607 18.2927 28.4063 18.1874 28.141 18.1875C27.8757 18.1876 27.6214 18.2931 27.4339 18.4807C27.2464 18.6683 27.1411 18.9228 27.1412 19.1881C27.1413 19.4533 27.2467 19.7077 27.4344 19.8952L28.5554 21.0152H21.0054C20.7402 21.0152 20.4858 21.1206 20.2983 21.3081C20.1107 21.4956 20.0054 21.75 20.0054 22.0152C20.0054 22.2804 20.1107 22.5348 20.2983 22.7223C20.4858 22.9098 20.7402 23.0152 21.0054 23.0152H31.0054V23.0162Z"
      />
    </SvgIcon>
  );
}

function StatsIcon(props) {
  const { color, className } = props;
  return (
    <SvgIcon viewBox="0, 0, 24, 24" className={className}>
      <path
        d="M8.14356 15.8567H5.57056V9.42969H8.14256V15.8577L8.14356 15.8567Z"
        fill={color}
      />
      <path d="M13.2846 15.857H10.7126V3H13.2846V15.857Z" fill={color} />
      <path
        d="M18.4279 15.8574H15.8569V6.85742H18.4279V15.8574Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21 20.7129H3V18.7129H21V20.7129Z"
        fill={color}
      />
    </SvgIcon>
  );
}

function StatsIconSelected(props) {
  const { color, altColor, className } = props;
  return (
    <SvgIcon viewBox="0, 0, 48, 48" className={className}>
      <rect width="48" height="48" rx="24" fill={color} />
      <path
        d="M20.1438 27.8567H17.5708V21.4297H20.1428V27.8577L20.1438 27.8567Z"
        fill={altColor}
      />
      <path d="M25.2849 27.857H22.7129V15H25.2849V27.857Z" fill={altColor} />
      <path
        d="M30.4279 27.8574H27.8569V18.8574H30.4279V27.8574Z"
        fill={altColor}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M33 32.7129H15V30.7129H33V32.7129Z"
        fill={altColor}
      />
    </SvgIcon>
  );
}

function LendIcon(props) {
  const { color, className } = props;
  return (
    <SvgIcon viewBox="0, 0, 24, 24" className={className}>
      <path
        d="M5.37227 4.51001C7.19897 2.88939 9.55729 1.99616 11.9993 2.00001C17.5223 2.00001 21.9993 6.47701 21.9993 12C22.0025 14.0439 21.3765 16.0393 20.2063 17.715L17.4993 12H19.9993C19.9993 10.4094 19.5251 8.85482 18.6374 7.53496C17.7496 6.2151 16.4886 5.18985 15.0153 4.59017C13.542 3.99049 11.9234 3.84362 10.3663 4.16831C8.80912 4.493 7.3841 5.27451 6.27327 6.41301L5.37327 4.51101L5.37227 4.51001ZM18.6263 19.49C16.7996 21.1106 14.4412 22.0039 11.9993 22C6.47627 22 1.99927 17.523 1.99927 12C1.99927 9.87501 2.66227 7.90501 3.79227 6.28501L6.49927 12H3.99927C3.99924 13.5907 4.47339 15.1452 5.36115 16.4651C6.24891 17.7849 7.50997 18.8102 8.98324 19.4099C10.4565 20.0095 12.0751 20.1564 13.6323 19.8317C15.1894 19.507 16.6144 18.7255 17.7253 17.587L18.6253 19.489L18.6263 19.49ZM12.9993 13.535H15.9993V15.535H12.9993V17.535H10.9993V15.535H7.99927V13.535H10.9993V12.535H7.99927V10.535H10.5853L8.46327 8.41401L9.87927 7.00001L11.9993 9.12101L14.1203 7.00001L15.5353 8.41401L13.4133 10.536H15.9993V12.536H12.9993V13.536V13.535Z"
        fill={color}
      />
    </SvgIcon>
  );
}

function LendIconSelected(props) {
  const { color, altColor, className } = props;
  return (
    <SvgIcon viewBox="0, 0, 48, 48" className={className}>
      <rect width="48" height="48" rx="24" fill={color} />
      <path
        d="M17.3725 16.51C19.1992 14.8894 21.5575 13.9962 23.9995 14C29.5225 14 33.9995 18.477 33.9995 24C34.0028 26.0439 33.3767 28.0393 32.2065 29.715L29.4995 24H31.9995C31.9995 22.4094 31.5254 20.8548 30.6376 19.535C29.7499 18.2151 28.4888 17.1898 27.0155 16.5902C25.5423 15.9905 23.9237 15.8436 22.3665 16.1683C20.8094 16.493 19.3843 17.2745 18.2735 18.413L17.3735 16.511L17.3725 16.51ZM30.6265 31.49C28.7998 33.1106 26.4415 34.0039 23.9995 34C18.4765 34 13.9995 29.523 13.9995 24C13.9995 21.875 14.6625 19.905 15.7925 18.285L18.4995 24H15.9995C15.9995 25.5907 16.4736 27.1452 17.3614 28.4651C18.2491 29.7849 19.5102 30.8102 20.9835 31.4099C22.4568 32.0095 24.0754 32.1564 25.6325 31.8317C27.1897 31.507 28.6147 30.7255 29.7255 29.587L30.6255 31.489L30.6265 31.49ZM24.9995 25.535H27.9995V27.535H24.9995V29.535H22.9995V27.535H19.9995V25.535H22.9995V24.535H19.9995V22.535H22.5855L20.4635 20.414L21.8795 19L23.9995 21.121L26.1205 19L27.5355 20.414L25.4135 22.536H27.9995V24.536H24.9995V25.536V25.535Z"
        fill={altColor}
      />
    </SvgIcon>
  );
}

function LTVIcon(props) {
  const { color, className } = props;
  return (
    <SvgIcon viewBox="0, 0, 24, 24" className={className}>
      <path
        fill={color}
        d="M13 9.5h5v-2h-5v2zm0 7h5v-2h-5v2zm6 4.5H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2zM6 11h5V6H6v5zm1-4h3v3H7V7zM6 18h5v-5H6v5zm1-4h3v3H7v-3z"
      ></path>
    </SvgIcon>
  );
}

function LTVIconSelected(props) {
  const { color, altColor, className } = props;
  return (
    <div
      style={{
        background: color,
        borderRadius: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginRight: "20px",
      }}
    >
      <SvgIcon viewBox="0, 0, 24, 24" className={className}>
        <path
          fill={altColor}
          d="M13 9.5h5v-2h-5v2zm0 7h5v-2h-5v2zm6 4.5H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2zM6 11h5V6H6v5zm1-4h3v3H7V7zM6 18h5v-5H6v5zm1-4h3v3H7v-3z"
        ></path>
      </SvgIcon>
    </div>
  );
}

function CDPIcon(props) {
  const { color, className } = props;
  return (
    <SvgIcon viewBox="0, 0, 24, 24" className={className}>
      <path
        fill={color}
        d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
      ></path>
    </SvgIcon>
  );
}

function CDPIconSelected(props) {
  const { color, altColor, className } = props;
  return (
    <div
      style={{
        background: color,
        borderRadius: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginRight: "14px",
      }}
    >
      <SvgIcon viewBox="0, 0, 24, 24" className={className}>
        <path
          fill={altColor}
          d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
        ></path>
      </SvgIcon>
    </div>
  );
}

const StyledSwitch = withStyles((theme) => ({
  root: {
    width: 58,
    height: 32,
    padding: 0,
    margin: theme.spacing(1),
  },
  switchBase: {
    padding: 1,
    "&$checked": {
      transform: "translateX(28px)",
      color: "#212529",
      "& + $track": {
        backgroundColor: "#ffffff",
        opacity: 1,
      },
    },
    "&$focusVisible $thumb": {
      color: "#ffffff",
      border: "6px solid #fff",
    },
  },
  thumb: {
    width: 24,
    height: 24,
  },
  track: {
    borderRadius: 32 / 2,
    border: `1px solid #212529`,
    backgroundColor: "#212529",
    opacity: 1,
    transition: theme.transitions.create(["background-color", "border"]),
  },
  checked: {},
  focusVisible: {},
}))(({ classes, ...props }) => {
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked,
      }}
      {...props}
    />
  );
});

function Navigation(props) {
  const router = useRouter();

  const account = stores.accountStore.getStore("account");

  const [darkMode, setDarkMode] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNavigate(route) {
    router.push(route);
  }

  const onMenuClicked = () => {
    setMenuOpen(!menuOpen);
  };

  const handleToggleChange = (event, val) => {
    setDarkMode(val);
    props.changeTheme(val);
  };

  const onAddressClicked = () => {
    setUnlockOpen(true);
  };

  const closoeUnlock = () => {
    setUnlockOpen(false);
  };

  useEffect(function () {
    const localStorageDarkMode = window.localStorage.getItem(
      "yearn.finance-dark-mode"
    );
    setDarkMode(localStorageDarkMode ? localStorageDarkMode === "dark" : false);
  }, []);

  useEffect(
    function () {
      setDarkMode(props.theme.palette.type === "dark" ? true : false);
    },
    [props.theme]
  );

  const activePath = router.asPath;
  const renderNavs = () => {
    return (
      <React.Fragment>
        {renderNav(
          "Invest",
          "invest",
          <InvestIcon
            className={classes.icon}
            color={darkMode ? "white" : "rgb(33, 37, 41)"}
            altColor={darkMode ? "rgb(33, 37, 41)" : "white"}
          />,
          <InvestIconSelected
            className={classes.iconSelected}
            color={darkMode ? "white" : "rgb(33, 37, 41)"}
            altColor={darkMode ? "rgb(33, 37, 41)" : "white"}
          />
        )}
        {account &&
          account.address &&
          renderNav(
            "Lend",
            "lend",
            <LendIcon
              className={classes.icon}
              color={darkMode ? "white" : "rgb(33, 37, 41)"}
              altColor={darkMode ? "rgb(33, 37, 41)" : "white"}
            />,
            <LendIconSelected
              className={classes.iconSelected}
              color={darkMode ? "white" : "rgb(33, 37, 41)"}
              altColor={darkMode ? "rgb(33, 37, 41)" : "white"}
            />
          )}
        {account &&
          account.address &&
          renderNav(
            "CDP",
            "cdp",
            <CDPIcon
              className={classes.icon}
              color={darkMode ? "white" : "rgb(33, 37, 41)"}
              altColor={darkMode ? "rgb(33, 37, 41)" : "white"}
            />,
            <CDPIconSelected
              className={classes.iconHack}
              color={darkMode ? "white" : "rgb(33, 37, 41)"}
              altColor={darkMode ? "rgb(33, 37, 41)" : "white"}
            />
          )}
        {account &&
          account.address &&
          renderNav(
            "LTV",
            "ltv",
            <LTVIcon
              className={classes.icon}
              color={darkMode ? "white" : "rgb(33, 37, 41)"}
              altColor={darkMode ? "rgb(33, 37, 41)" : "white"}
            />,
            <LTVIconSelected
              className={classes.iconHack}
              color={darkMode ? "white" : "rgb(33, 37, 41)"}
              altColor={darkMode ? "rgb(33, 37, 41)" : "white"}
            />
          )}
        {renderNav(
          "Stats",
          "system",
          <StatsIcon
            className={classes.icon}
            color={darkMode ? "white" : "rgb(33, 37, 41)"}
            altColor={darkMode ? "rgb(33, 37, 41)" : "white"}
          />,
          <StatsIconSelected
            className={classes.iconSelected}
            color={darkMode ? "white" : "rgb(33, 37, 41)"}
            altColor={darkMode ? "rgb(33, 37, 41)" : "white"}
          />
        )}
      </React.Fragment>
    );
  };

  const renderNav = (title, link, icon, iconSelected) => {
    return (
      <div
        className={classes.navigationOptionContainer}
        onClick={() => {
          handleNavigate("/" + link);
        }}
      >
        {activePath.includes("/" + link) ? (
          <div
            className={
              darkMode
                ? classes.navigationOptionSelectedWhite
                : classes.navigationOptionSelected
            }
          ></div>
        ) : (
          <div className={classes.navigationOptionNotSelected}></div>
        )}
        {activePath.includes("/" + link)
          ? iconSelected
          : icon}
        <Typography variant="h2">{title}</Typography>
      </div>
    );
  };

  return (
    <Paper elevation={0} className={classes.navigationContainer}>
      <div className={classes.navigationHeading}>
        <a onClick={() => router.push('/')} className={classes.linkz}>
        <YearnIcon
          color={darkMode ? "white" : "rgb(33, 37, 41)"}
          altColor={darkMode ? "rgb(255, 255, 255)" : "white"}
          width="123px"
          height="42.3px"
          className={classes.yearnLogo}
        />
        </a>
      </div>

      <div className={classes.navigationContent}>{renderNavs()}</div>

      {menuOpen && (
        <Paper elevation={0} className={classes.navigationContentMobile}>
          <div className={classes.menuIcon}>
            <Button
              color={
                props.theme.palette.type === "light" ? "primary" : "secondary"
              }
              onClick={onMenuClicked}
              disableElevation
            >
              <CloseIcon fontSize={"large"} />
            </Button>
          </div>
          <YearnIcon
            color={darkMode ? "white" : "rgb(33, 37, 41)"}
            altColor={darkMode ? "rgb(255, 255, 255)" : "white"}
            width="123px"
            height="42.3px"
            className={classes.yearnLogo}
          />
          <div className={classes.navigationContentNavs}>{renderNavs()}</div>
          <div className={classes.headerThings}>
            <div className={classes.themeSelectContainer}>
              <StyledSwitch
                icon={<Brightness2Icon className={classes.switchIcon} />}
                checkedIcon={
                  <WbSunnyOutlinedIcon className={classes.switchIcon} />
                }
                checked={darkMode}
                onChange={handleToggleChange}
              />
            </div>
            <Button
              disableElevation
              className={classes.accountButton}
              variant="contained"
              color="secondary"
              onClick={onAddressClicked}
            >
              <div
                className={`${classes.accountIcon} ${classes.metamask}`}
              ></div>
              <Typography variant="h5">
                {account ? formatAddress(account.address) : "Connect Wallet"}
              </Typography>
            </Button>

            {unlockOpen && (
              <Unlock modalOpen={unlockOpen} closeModal={closoeUnlock} />
            )}
          </div>
        </Paper>
      )}

      <div className={classes.menuIcon}>
        <Button
          color={props.theme.palette.type === "light" ? "primary" : "secondary"}
          onClick={onMenuClicked}
          disableElevation
        >
          <MenuIcon fontSize={"large"} />
        </Button>
      </div>

      {props.backClicked && (
        <div className={classes.backButtonContainer}>
          <div className={classes.backButton}>
            <Button
              color={
                props.theme.palette.type === "light" ? "primary" : "secondary"
              }
              onClick={props.backClicked}
              disableElevation
            >
              <ArrowBackIcon fontSize={"large"} />
            </Button>
          </div>
        </div>
      )}

      <div className={classes.socials}>
      <Grid className={classes.socialgrid} container spacing={1}>
        <Grid item xs={6}>
          <a
            className={`${classes.socialButton}`}
            href="https://twitter.com/iearnfinance"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg version="1.1" width="22" height="22" viewBox="0 0 24 24">
              <path
                fill={props.theme.palette.type === "light" ? "#676c7b" : "#FFF"}
                d="M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.5 2.96,10.3 2.38,10C2.38,10 2.38,10 2.38,10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.43,16 6,17.26 7.89,17.29C6.43,18.45 4.58,19.13 2.56,19.13C2.22,19.13 1.88,19.11 1.54,19.07C3.44,20.29 5.7,21 8.12,21C16,21 20.33,14.46 20.33,8.79C20.33,8.6 20.33,8.42 20.32,8.23C21.16,7.63 21.88,6.87 22.46,6Z"
              />
            </svg>
          </a>
        </Grid>
        <Grid item xs={6}>
          <a
            className={`${classes.socialButton}`}
            href="https://medium.com/iearn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="20" viewBox="0 0 256 256" version="1.1">
              <g>
                <rect
                  fill={props.theme.palette.type === "light" ? "#676c7b" : "#FFF"}
                  x="0"
                  y="0"
                  width="256"
                  height="256"
                ></rect>
                <path
                  d="M61.0908952,85.6165814 C61.3045665,83.5054371 60.4994954,81.4188058 58.9230865,79.9979257 L42.8652446,60.6536969 L42.8652446,57.7641026 L92.7248438,57.7641026 L131.263664,142.284737 L165.145712,57.7641026 L212.676923,57.7641026 L212.676923,60.6536969 L198.947468,73.8174045 C197.763839,74.719636 197.176698,76.2025173 197.421974,77.670197 L197.421974,174.391342 C197.176698,175.859021 197.763839,177.341902 198.947468,178.244134 L212.355766,191.407842 L212.355766,194.297436 L144.91283,194.297436 L144.91283,191.407842 L158.802864,177.923068 C160.16778,176.558537 160.16778,176.157205 160.16778,174.070276 L160.16778,95.8906948 L121.54867,193.97637 L116.329871,193.97637 L71.3679139,95.8906948 L71.3679139,161.628966 C70.9930375,164.392788 71.9109513,167.175352 73.8568795,169.174019 L91.9219516,191.086776 L91.9219516,193.97637 L40.6974359,193.97637 L40.6974359,191.086776 L58.7625081,169.174019 C60.6942682,167.172038 61.5586577,164.371016 61.0908952,161.628966 L61.0908952,85.6165814 Z"
                  fill={props.theme.palette.type === "light" ? "#FFF" : "#131929"}
                ></path>
              </g>
            </svg>
          </a>
        </Grid>
        <Grid item xs={6}>
          <a
            className={`${classes.socialButton}`}
            href="https://discord.com/invite/6PNv2nF/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg version="1.1" width="20" height="24" viewBox="0 0 24 24">
              <path
                fill={props.theme.palette.type === "light" ? "#676c7b" : "#FFF"}
                d="M22,24L16.75,19L17.38,21H4.5A2.5,2.5 0 0,1 2,18.5V3.5A2.5,2.5 0 0,1 4.5,1H19.5A2.5,2.5 0 0,1 22,3.5V24M12,6.8C9.32,6.8 7.44,7.95 7.44,7.95C8.47,7.03 10.27,6.5 10.27,6.5L10.1,6.33C8.41,6.36 6.88,7.53 6.88,7.53C5.16,11.12 5.27,14.22 5.27,14.22C6.67,16.03 8.75,15.9 8.75,15.9L9.46,15C8.21,14.73 7.42,13.62 7.42,13.62C7.42,13.62 9.3,14.9 12,14.9C14.7,14.9 16.58,13.62 16.58,13.62C16.58,13.62 15.79,14.73 14.54,15L15.25,15.9C15.25,15.9 17.33,16.03 18.73,14.22C18.73,14.22 18.84,11.12 17.12,7.53C17.12,7.53 15.59,6.36 13.9,6.33L13.73,6.5C13.73,6.5 15.53,7.03 16.56,7.95C16.56,7.95 14.68,6.8 12,6.8M9.93,10.59C10.58,10.59 11.11,11.16 11.1,11.86C11.1,12.55 10.58,13.13 9.93,13.13C9.29,13.13 8.77,12.55 8.77,11.86C8.77,11.16 9.28,10.59 9.93,10.59M14.1,10.59C14.75,10.59 15.27,11.16 15.27,11.86C15.27,12.55 14.75,13.13 14.1,13.13C13.46,13.13 12.94,12.55 12.94,11.86C12.94,11.16 13.45,10.59 14.1,10.59Z"
              />
            </svg>
          </a>
        </Grid>
        <Grid item xs={6}>
          <a
            className={`${classes.socialButton}`}
            href="https://github.com/antonnell/yearn-finance.git"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg version="1.1" width="23" height="24" viewBox="0 0 24 24">
              <path
                fill={props.theme.palette.type === "light" ? "#676c7b" : "#FFF"}
                d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"
              />
            </svg>
          </a>
        </Grid>
        </Grid>
      </div>
      <Typography className={classes.smallVersion}>Version 1.3.2</Typography>
    </Paper>
  );
}

export default withTheme(Navigation);
