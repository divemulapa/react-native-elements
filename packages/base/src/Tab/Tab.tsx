import React from 'react';
import {
  View,
  Animated,
  StyleProp,
  ViewStyle,
  ViewProps,
  StyleSheet,
  ScrollView,
  LayoutChangeEvent,
} from 'react-native';
import { defaultTheme, RneFunctionComponent } from '../helpers';
import { TabItemProps } from './Tab.Item';

export interface TabProps extends ViewProps {
  /** Child position index value. */
  value?: number;

  /** Makes Tab Scrolling */
  scrollable?: boolean;

  /** On Index Change Callback. */
  onChange?: (value: number) => void;

  /** Disable the indicator below. */
  disableIndicator?: boolean;

  /** Additional styling for tab indicator. */
  indicatorStyle?: StyleProp<ViewStyle>;

  /** Style for Tab container */
  containerStyle?: StyleProp<ViewStyle>;

  /** Define the background Variant. */
  variant?: 'primary' | 'default';
}

/**
 * Tabs organize content across different screens, data sets, and other interactions.
 *
 * :::note
 * This component is not for (complex) navigation. Use [React Navigation](https://reactnavigation.org) for that.
 * :::
 * @usage
 *  ```tsx live
 * <Tab value={0} variant='primary'>
 * <Tab.Item>Tab 1</Tab.Item>
 * <Tab.Item>Tab 2</Tab.Item>
 * </Tab>
 * ```
 *
 *  */
export const TabBase: RneFunctionComponent<TabProps> = ({
  theme = defaultTheme,
  children,
  value,
  scrollable = false,
  onChange = () => {},
  indicatorStyle,
  disableIndicator,
  variant,
  containerStyle,
  ...rest
}) => {
  const animationRef = React.useRef(new Animated.Value(0));
  const scrollViewRef = React.useRef<ScrollView>(null);
  const scrollViewPosition = React.useRef(0);
  const validChildren = React.useMemo(
    () => React.Children.toArray(children),
    [children]
  );

  const tabItemPositions = React.useRef<
    Array<{ position: number; width: number }>
  >([]);
  const [tabContainerWidth, setTabContainerWidth] = React.useState(0);

  const scrollHandler = React.useCallback(
    (currValue: number) => {
      if (tabItemPositions.current.length > currValue) {
        let itemStartPosition =
          currValue === 0
            ? 0
            : tabItemPositions.current[currValue - 1].position;
        let itemEndPosition = tabItemPositions.current[currValue].position;

        const scrollCurrentPosition = scrollViewPosition.current;
        const tabContainerCurrentWidth = tabContainerWidth;

        let scrollX = scrollCurrentPosition;

        if (itemStartPosition < scrollCurrentPosition) {
          scrollX += itemStartPosition - scrollCurrentPosition;
        } else if (
          scrollCurrentPosition + tabContainerCurrentWidth <
          itemEndPosition
        ) {
          scrollX +=
            itemEndPosition -
            (scrollCurrentPosition + tabContainerCurrentWidth);
        }

        scrollViewRef.current.scrollTo({
          x: scrollX,
          y: 0,
          animated: true,
        });
      }
    },
    [tabContainerWidth]
  );

  React.useEffect(() => {
    Animated.timing(animationRef.current, {
      toValue: value as number,
      useNativeDriver: true,
      duration: 170,
    }).start();
    scrollable && requestAnimationFrame(() => scrollHandler(value));
  }, [animationRef, scrollHandler, value, scrollable]);

  const onScrollHandler = React.useCallback((event) => {
    scrollViewPosition.current = event.nativeEvent.contentOffset.x;
  }, []);

  const indicatorTransitionInterpolate = React.useMemo(() => {
    const countItems = validChildren.length;
    if (countItems < 2 || !tabItemPositions.current.length) {
      return 0;
    }
    const inputRange = Array.from(Array(countItems + 1).keys());
    const outputRange = tabItemPositions.current.map(
      ({ position }) => position
    );
    return animationRef.current.interpolate({
      inputRange,
      outputRange: [0, ...outputRange],
    });
  }, [animationRef, validChildren]);

  const WIDTH = React.useMemo(() => {
    return tabItemPositions.current[value]?.width;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, tabItemPositions.current.length]);

  return (
    <View
      {...rest}
      accessibilityRole="tablist"
      style={[
        variant === 'primary' && {
          backgroundColor: theme?.colors?.primary,
        },
        styles.viewStyle,
        containerStyle,
      ]}
      onLayout={({ nativeEvent: { layout } }) => {
        setTabContainerWidth(layout.width);
      }}
    >
      {React.createElement(scrollable ? ScrollView : React.Fragment, {
        ...(scrollable && {
          horizontal: true,
          ref: scrollViewRef,
          onScroll: onScrollHandler,
          showsHorizontalScrollIndicator: false,
        }),
        children: (
          <>
            {validChildren.map((child, index) => {
              return React.cloneElement(
                child as React.ReactElement<TabItemProps>,
                {
                  onPress: () => onChange(index),
                  onLayout: (event: LayoutChangeEvent) => {
                    const { width } = event.nativeEvent.layout;
                    const previousItemPosition =
                      tabItemPositions.current[index - 1]?.position || 0;

                    tabItemPositions.current[index] = {
                      position: previousItemPosition + width,
                      width,
                    };
                  },
                  active: index === value,
                  variant,
                }
              );
            })}
            {!disableIndicator && (
              <Animated.View
                style={[
                  styles.indicator,
                  {
                    backgroundColor: theme?.colors?.secondary,
                    transform: [
                      {
                        translateX: indicatorTransitionInterpolate,
                      },
                    ],
                    width: WIDTH,
                  },
                  indicatorStyle,
                ]}
              />
            )}
          </>
        ),
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonStyle: {
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  titleStyle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  containerStyle: {
    flex: 1,
    borderRadius: 0,
  },
  viewStyle: {
    flexDirection: 'row',
    position: 'relative',
  },
  indicator: {
    display: 'flex',
    position: 'absolute',
    height: 2,
    bottom: 0,
  },
});

TabBase.displayName = 'Tab';
