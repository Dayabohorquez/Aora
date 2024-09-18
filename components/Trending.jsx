import React, { useState, useCallback } from 'react';
import { FlatList, Image, ImageBackground, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import * as Animatable from 'react-native-animatable';
import { icons } from '../constants';

const zoomIn = {
  0: {
    scale: 0.9,
  },
  1: {
    scale: 1,
  },
};

const zoomOut = {
  0: {
    scale: 1,
  },
  1: {
    scale: 0.9,
  },
};

const TrendingItem = ({ activeItem, item }) => {
  const [play, setPlay] = useState(false);
  const [status, setStatus] = useState({});

  const handlePlay = () => setPlay(true);

  const handlePlaybackStatusUpdate = (status) => {
    setStatus(status);
    if (status.didJustFinish) {
      setPlay(false);
    }
  };

  return (
    <Animatable.View
      className="mr-5"
      animation={activeItem === item.$id ? zoomIn : zoomOut}
      duration={500}
    >
      {play ? (
        <View className="w-52 h-72 rounded-[33px] mt-3 bg-white/10">
          <Video
            source={{ uri: item.video }}
            className="w-full h-full"
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onError={(error) => {
              console.error('Video Error:', error);
              Alert.alert('Error', 'Failed to load video. Please try again later.');
            }}
          />
          {status.isBuffering && (
            <ActivityIndicator
              size="large"
              color="#ffffff"
              style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -20 }, { translateY: -20 }] }}
            />
          )}
        </View>
      ) : (
        <TouchableOpacity
          className="relative flex justify-center items-center"
          activeOpacity={0.7}
          onPress={handlePlay}
        >
          <ImageBackground
            source={{ uri: item.thumbnail }}
            className="w-52 h-72 rounded-[33px] my-5 overflow-hidden shadow-lg shadow-black/40"
            resizeMode="cover"
          >
            <Image
              source={icons.play}
              className="w-12 h-12 absolute"
              resizeMode="contain"
            />
          </ImageBackground>
        </TouchableOpacity>
      )}
    </Animatable.View>
  );
};

const Trending = ({ posts }) => {
  const [activeItem, setActiveItem] = useState(posts[0]?.$id || null);

  const viewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveItem(viewableItems[0].item.$id);
    }
  }, []);

  return (
    <FlatList
      data={posts}
      horizontal
      keyExtractor={(item) => item.$id}
      renderItem={({ item }) => (
        <TrendingItem activeItem={activeItem} item={item} />
      )}
      onViewableItemsChanged={viewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 70,
      }}
    />
  );
};

export default Trending;
