#!/usr/bin/env python3

with open('src/screens/WelcomeScreen.tsx', 'r') as f:
    lines = f.readlines()

scrollview_content = """
      {/* Sliding Images */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{flex: 1}}
        onTouchStart={stopAutoSlide}
        onTouchEnd={() => setTimeout(startAutoSlide, 500)}
      >
        {onboardingSlides.map((slide, index) => (
          <View key={slide.id} style={{width: width, flex: 1}}>
            <LinearGradient
              colors={index === 0 ? ['#4338ca', '#7c3aed'] : index === 1 ? ['#dc2626', '#ea580c'] : ['#059669', '#0891b2']}
              style={{flex: 1, justifyContent: 'flex-end'}}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', padding: 24}}
              >
                <View style={{alignItems: 'center', marginBottom: 120, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 24, paddingVertical: 20, borderRadius: 12}}>
                  <Text style={{color: 'white', fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, lineHeight: 38}}>{slide.title}</Text>
                  <Text style={{color: 'white', fontSize: 16, textAlign: 'center', lineHeight: 24}}>{slide.subtitle}</Text>
                </View>
              </LinearGradient>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
"""

lines.insert(141, scrollview_content)

with open('src/screens/WelcomeScreen.tsx', 'w') as f:
    f.writelines(lines)

print('ScrollView added successfully!') 