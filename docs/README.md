# FreshDrop - Authentication System - Quick Reference

## 🚀 What's New

A complete authentication system with:

- ✅ Local storage (AsyncStorage) for user management
- ✅ Default user (9999999999 / OTP: 111111)
- ✅ Full signup and login flows
- ✅ Performance optimizations (useMemo, useCallback, React.memo)
- ✅ Proper code separation and organization
- ✅ Comprehensive documentation

---

## 📁 New Files Created

### Services

- `services/authService.js` - Authentication business logic

### Utils

- `utils/authUtils.js` - Validation and formatting utilities

### State Management

- `store/slices/authSlice.js` - Redux authentication state

### UI Components (Refactored)

- `app/auth/login.js` - Optimized login screen
- `app/auth/signup.js` - Optimized signup screen
- `app/auth/otp.js` - Optimized OTP verification screen

### Documentation

- `docs/AUTHENTICATION.md` - Detailed auth system documentation
- `docs/PROJECT_WORKFLOW.md` - Complete project architecture guide
- `docs/README.md` - This file

---

## 🔑 Default Credentials

**Phone**: 9999999999  
**OTP**: 111111

All new users will also use OTP: **111111**

---

## 🎯 Key Features

### 1. **Local Storage**

- Users stored in AsyncStorage under `auth_users`
- Current session in `auth_current_user`
- Persists across app restarts

### 2. **Performance Optimizations**

**useMemo** - For expensive computations:

```javascript
const isFormValid = useMemo(() => {
  return validateName(name) && validateEmail(email);
}, [name, email]);
```

**useCallback** - For event handlers:

```javascript
const handleLogin = useCallback(async () => {
  await dispatch(login({ phone, otp }));
}, [phone, otp]);
```

**React.memo** - For child components:

```javascript
const LoginButton = React.memo(({ onPress, disabled }) => (
  <Pressable onPress={onPress} disabled={disabled}>
    <Text>Login</Text>
  </Pressable>
));
```

### 3. **Code Organization**

**Separation of Concerns**:

- **Service Layer**: Business logic (`authService.js`)
- **Utils Layer**: Validation & formatting (`authUtils.js`)
- **State Layer**: Redux state management (`authSlice.js`)
- **UI Layer**: React components (`login.js`, `signup.js`, `otp.js`)

---

## 📖 How to Use

### Login Flow

1. Open app → Navigate to Login
2. Enter phone: `9999999999`
3. Tap "Continue"
4. Enter OTP: `111111`
5. Tap "Verify OTP"
6. ✅ Logged in!

### Signup Flow

1. Navigate to Signup
2. Enter name, email, and phone
3. Tap "Create Account"
4. Enter OTP: `111111`
5. Tap "Verify OTP"
6. ✅ Account created and logged in!

---

## 🔧 Integration

### Check Authentication Status

```javascript
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "../store/slices/authSlice";

const isAuthenticated = useSelector(selectIsAuthenticated);
const user = useSelector(selectUser);

if (!isAuthenticated) {
  router.push("/auth/login");
}
```

### Logout

```javascript
import { useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";

const dispatch = useDispatch();
await dispatch(logout());
router.replace("/auth/login");
```

---

## 📚 Documentation

For detailed information, see:

1. **[AUTHENTICATION.md](./AUTHENTICATION.md)** - Complete auth system documentation

   - Architecture overview
   - Component details
   - Performance optimizations
   - Storage structure
   - Error handling

2. **[PROJECT_WORKFLOW.md](./PROJECT_WORKFLOW.md)** - Project architecture guide
   - Technology stack
   - File structure
   - Application flow
   - State management
   - Development workflow

---

## 🧪 Testing

### Test Scenarios

**Login**:

- ✅ Valid phone (9999999999) → Success
- ❌ Invalid phone (123) → Error
- ❌ Wrong OTP (000000) → Error
- ✅ Correct OTP (111111) → Success

**Signup**:

- ✅ New phone number → Creates account
- ❌ Existing phone → Error
- ❌ Invalid email → Error
- ✅ Valid data → Success

**Persistence**:

- ✅ Close app → Session persists
- ✅ Logout → Session cleared

---

## 🎨 Performance Benefits

### Before Optimization

- Components re-render on every state change
- Validation runs on every render
- Event handlers recreated on every render

### After Optimization

- ✅ Components only re-render when props change (React.memo)
- ✅ Validation only runs when inputs change (useMemo)
- ✅ Event handlers maintain same reference (useCallback)
- ✅ Redux selectors automatically memoized

**Result**: Smoother UI, better performance, reduced battery usage

---

## 🔄 Data Flow

```
User Input
    ↓
UI Component (login.js)
    ↓
Validation (authUtils.js)
    ↓
Redux Action (authSlice.js)
    ↓
Service Call (authService.js)
    ↓
AsyncStorage
    ↓
Redux State Update
    ↓
UI Re-render (only affected components)
```

---

## 🚦 Next Steps

1. **Test the authentication flow**

   - Try logging in with default credentials
   - Create a new account
   - Test logout

2. **Review the documentation**

   - Read AUTHENTICATION.md for auth details
   - Read PROJECT_WORKFLOW.md for architecture

3. **Integrate with your app**
   - Use `selectIsAuthenticated` to protect routes
   - Access `selectUser` for user data
   - Dispatch `logout` when needed

---

## 💡 Tips

1. **All users use OTP 111111** - This is for demo purposes
2. **Default user always available** - Phone: 9999999999
3. **Session persists** - Users stay logged in after app restart
4. **Validation is real-time** - Errors show as you type
5. **Performance optimized** - Uses React best practices

---

## 🐛 Troubleshooting

**Issue**: Can't login  
**Solution**: Make sure you're using phone 9999999999 and OTP 111111

**Issue**: State not persisting  
**Solution**: Check that authSlice is added to Redux store

**Issue**: App crashes on login  
**Solution**: Ensure AsyncStorage permissions are granted

---

## 📞 Support

For questions or issues:

1. Check the documentation files
2. Review the code comments
3. Test with default credentials first

---

**Happy Coding! 🎉**
