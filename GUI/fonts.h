#ifndef __FONTS_H
#define __FONTS_H

#include "u8g2_font.h"

/**
 * 文字列表:
所有 ASCII 字符 (32-128)
正月二月三月四月五月六月七月八月九月十月
冬月腊月
农历闰
初一初二初三初四初五初六初七初八初九初十
十一十二十三十四十五十六十七十八十九二十
廿一廿二廿三廿四廿五廿六廿七廿八廿九三十
未知
星期一二三四五六日
猴鸡狗猪鼠牛虎兔龙蛇马羊
庚辛壬癸甲乙丙丁戊已
申酉戌亥子丑寅卯辰巳午未
小寒大寒立春雨水惊蛰春分清明谷雨立夏小满芒种夏至小暑大暑立秋处暑白露秋分寒露霜降立冬小雪大雪冬至
年月日时分秒
离还有天
℃
元旦节情人节妇女节植树节愚人节清明节劳动节青年节儿童节建党节建军节教师节国庆节
母亲节父亲节万圣节感恩节平安夜圣诞节
春节元宵节龙抬头端午节七夕节中元节中秋节重阳节寒衣节腊八节除夕
休班
 */
extern const uint8_t u8g2_font_wqy9_t_lunar[] U8G2_FONT_SECTION("u8g2_font_wqy9_t_lunar");
extern const uint8_t u8g2_font_wqy12_t_lunar[] U8G2_FONT_SECTION("u8g2_font_wqy12_t_lunar");

// 以下字库来自 u8g2，用于显示数字
extern const uint8_t u8g2_font_helvB14_tn[] U8G2_FONT_SECTION("u8g2_font_helvB14_tn");
extern const uint8_t u8g2_font_helvB18_tn[] U8G2_FONT_SECTION("u8g2_font_helvB18_tn");
#endif
