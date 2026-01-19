# Reusable Components Guide

This document explains how to use all the reusable components created for the app.

## 📦 Available Components

### 1. Button Component

**Location:** `components/ui/Button.js`

**Usage:**

```javascript
import { Button } from '@/components/ui';

// Primary button
<Button
  variant="primary"
  size="medium"
  title="Add to Cart"
  onPress={handlePress}
/>

// Secondary button
<Button
  variant="secondary"
  title="Reorder"
  \

  
  onPress={handleReorder}
/>

// Outline button
<Button
  variant="outline"
  title="Cancel"
  onPress={handleCancel}
/>

// Danger button
<Button
  variant="danger"
  size="small"
  title="Delete"
  onPress={handleDelete}
/>

// Disabled button
<Button
  variant="primary"
  title="Submit"
  disabled={true}
/>
```

**Props:**

- `variant`: 'primary' | 'secondary' | 'outline' | 'danger' (default: 'primary')
- `size`: 'small' | 'medium' | 'large' (default: 'medium')
- `title`: Button text (string)
- `onPress`: Function to call on press
- `disabled`: Boolean (default: false)
- `style`: Additional custom styles
- `textStyle`: Additional text styles

---

### 2. BackButton Component

**Location:** `components/ui/BackButton.js`

**Usage:**

```javascript
import { BackButton } from '@/components/ui';

<BackButton onPress={() => router.back()} />

// Custom styling
<BackButton
  onPress={() => router.back()}
  iconColor="#FC8019"
  iconSize={28}
/>
```

**Props:**

- `onPress`: Function to call on press
- `style`: Additional custom styles
- `iconColor`: Icon color (default: '#333')
- `iconSize`: Icon size (default: 24)

---

### 3. Header Component

**Location:** `components/ui/Header.js`

**Usage:**

```javascript
import { Header } from '@/components/ui';

// Simple header with back button
<Header
  title="My Orders"
  onBackPress={() => router.back()}
/>

// Header with right component
<Header
  title="Cart"
  onBackPress={() => router.back()}
  rightComponent={
    <TouchableOpacity onPress={handleClear}>
      <Text>Clear</Text>
    </TouchableOpacity>
  }
/>

// Header without back button
<Header title="Profile" />
```

**Props:**

- `title`: Header title (string)
- `onBackPress`: Function for back button (optional)
- `rightComponent`: React component for right side (optional)
- `style`: Additional header styles
- `titleStyle`: Additional title styles

---

### 4. NavigationButtons Component

**Location:** `components/ui/NavigationButtons.js`

**Usage:**

```javascript
import { NavigationButtons } from "@/components/ui";

<NavigationButtons
  onLeftPress={() => scrollLeft()}
  onRightPress={() => scrollRight()}
  canScrollLeft={canScrollLeft}
  canScrollRight={canScrollRight}
/>;
```

**Props:**

- `onLeftPress`: Function for left arrow
- `onRightPress`: Function for right arrow
- `canScrollLeft`: Boolean to enable/disable left button (default: false)
- `canScrollRight`: Boolean to enable/disable right button (default: true)
- `style`: Additional custom styles

---

### 5. ProductCard Component

**Location:** `components/ui/ProductCard.js`

**Usage:**

```javascript
import { ProductCard } from '@/components/ui';

<ProductCard
  product={productData}
  onPress={() => router.push(`/product/${product.id}`)}
  onAddPress={() => dispatch(addToCart(product))}
/>

// Without add button
<ProductCard
  product={productData}
  onPress={() => router.push(`/product/${product.id}`)}
/>
```

**Props:**

- `product`: Product object with { name, image, price, discountPrice, quantity }
- `onPress`: Function when card is pressed
- `onAddPress`: Function when ADD button is pressed (optional)
- `style`: Additional custom styles

---

### 6. RestaurantCard Component

**Location:** `components/ui/RestaurantCard.js`

**Usage:**

```javascript
import { RestaurantCard } from '@/components/ui';

// Full card
<RestaurantCard
  restaurant={restaurantData}
  onPress={() => router.push(`/restaurant/${restaurant.id}`)}
/>

// Compact card
<RestaurantCard
  restaurant={restaurantData}
  onPress={() => router.push(`/restaurant/${restaurant.id}`)}
  compact={true}
/>
```

**Props:**

- `restaurant`: Restaurant object with { name, image, rating, time, cuisine, location, discount, priceForTwo }
- `onPress`: Function when card is pressed
- `style`: Additional custom styles
- `compact`: Boolean for compact layout (default: false)

---

### 7. SectionHeader Component

**Location:** `components/ui/SectionHeader.js`

**Usage:**

```javascript
import { SectionHeader, NavigationButtons } from '@/components/ui';

// Simple section header
<SectionHeader title="Suggested Products" />

// With navigation buttons
<SectionHeader
  title="Best Restaurants"
  rightComponent={
    <NavigationButtons
      onLeftPress={scrollLeft}
      onRightPress={scrollRight}
      canScrollLeft={canScrollLeft}
      canScrollRight={canScrollRight}
    />
  }
/>
```

**Props:**

- `title`: Section title (string)
- `rightComponent`: React component for right side (optional)
- `style`: Additional custom styles

**Features:**

- Responsive padding (20px on Android, 16px on others)

---

### 8. Container Component

**Location:** `components/ui/Container.js`

**Usage:**

```javascript
import { Container } from '@/components/ui';

// With default padding
<Container>
  <Text>Your content here</Text>
</Container>

// Without padding
<Container noPadding={true}>
  <Text>Full width content</Text>
</Container>

// With custom styles
<Container style={{ backgroundColor: '#f5f5f5' }}>
  <Text>Styled content</Text>
</Container>
```

**Props:**

- `children`: React components to wrap
- `style`: Additional custom styles
- `noPadding`: Remove default padding (default: false)

**Features:**

- Responsive padding (20px on Android/Web, 16px on iOS)

---

### 9. EmptyState Component

**Location:** `components/ui/EmptyState.js`

**Usage:**

```javascript
import { EmptyState } from '@/components/ui';

// Full empty state
<EmptyState
  image="https://cdn-icons-png.flaticon.com/512/11329/11329060.png"
  title="Your Cart is Empty"
  subtitle="Good food is always cooking! Go ahead, order some yummy items."
  buttonText="Browse Restaurants"
  onButtonPress={() => router.push('/home')}
/>

// Without button
<EmptyState
  image="https://example.com/empty.png"
  title="No Orders Found"
  subtitle="You haven't placed any orders yet."
/>
```

**Props:**

- `image`: Image URI (string)
- `title`: Main title (string)
- `subtitle`: Subtitle text (string, optional)
- `buttonText`: Button text (string, optional)
- `onButtonPress`: Function for button press (optional)
- `style`: Additional custom styles

---

## 🎨 Responsive Design

All components include **responsive padding** for different platforms:

- **Android**: 20px horizontal padding
- **Web**: 20px horizontal padding
- **iOS**: 16px horizontal padding

## 📱 SafeAreaView Usage

For pages, always wrap content in SafeAreaView:

```javascript
import { SafeAreaView } from "react-native-safe-area-context";

<SafeAreaView style={styles.container}>
  <Header title="Page Title" onBackPress={() => router.back()} />
  <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
    {/* Your content */}
  </ScrollView>
</SafeAreaView>;
```

## 🔄 Migration Example

**Before:**

```javascript
<TouchableOpacity
  style={{
    backgroundColor: "#FC8019",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  }}
  onPress={handlePress}
>
  <Text style={{ color: "#fff", fontWeight: "bold" }}>Add to Cart</Text>
</TouchableOpacity>
```

**After:**

```javascript
import { Button } from "@/components/ui";

<Button variant="primary" title="Add to Cart" onPress={handlePress} />;
```

## 📦 Import All Components

```javascript
import {
  Button,
  BackButton,
  Header,
  NavigationButtons,
  ProductCard,
  RestaurantCard,
  SectionHeader,
  Container,
  EmptyState,
} from "@/components/ui";
```

## ✅ Benefits

1. **Consistency**: Same look and feel across the app
2. **Maintainability**: Update once, changes everywhere
3. **Responsive**: Built-in platform-specific styling
4. **Reusability**: Use anywhere in the app
5. **Type Safety**: Clear prop definitions
6. **Performance**: Optimized components

---

**Created:** December 25, 2024
**Version:** 1.0.0
