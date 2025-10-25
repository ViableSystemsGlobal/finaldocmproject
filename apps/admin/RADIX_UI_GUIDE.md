# Radix UI Focus Management Guide

## 🚨 **Critical: Preventing "Too Much Recursion" Errors**

This guide documents how to prevent focus recursion errors when using nested Radix UI components.

### **The Problem**
When using nested Radix UI components (Dialog + Select, Dialog + Popover, etc.), different versions of `@radix-ui/react-focus-scope` can cause infinite recursion errors:

```
Uncaught InternalError: too much recursion
    focus webpack-internal:///.../react-focus-scope/dist/index.mjs:255
```

### **The Solution**
Force all Radix UI components to use the same version of focus-scope packages via overrides:

**Root `package.json`:**
```json
{
  "pnpm": {
    "overrides": {
      "@radix-ui/react-focus-scope": "1.1.7",
      "@radix-ui/react-dismissable-layer": "1.1.10"
    }
  }
}
```

**Admin `package.json`:**
```json
{
  "overrides": {
    "@radix-ui/react-focus-scope": "1.1.7",
    "@radix-ui/react-dismissable-layer": "1.1.10"
  }
}
```

### **Safe Patterns ✅**

#### **Dialog + Select with react-hook-form:**
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <Controller
      name="fieldName"
      control={control}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )}
    />
  </DialogContent>
</Dialog>
```

#### **Dialog + Popover + Calendar:**
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date) : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          // ❌ AVOID: initialFocus can cause conflicts in dialogs
        />
      </PopoverContent>
    </Popover>
  </DialogContent>
</Dialog>
```

### **Dangerous Patterns ❌**

#### **Manual Select Integration:**
```tsx
// ❌ DON'T DO THIS - can cause focus conflicts
<Select value={selectedValue} onValueChange={setValue}>
  {/* Manual state management without Controller */}
</Select>
```

#### **Nested Focus Traps:**
```tsx
// ❌ AVOID: Multiple initialFocus or focus traps
<Dialog>
  <Popover>
    <Calendar initialFocus /> {/* Can conflict with Dialog focus */}
  </Popover>
</Dialog>
```

### **Verification Commands**

Check for version conflicts:
```bash
npm ls @radix-ui/react-focus-scope
npm ls @radix-ui/react-dismissable-layer
```

All instances should show the same version with "deduped" notation.

### **When Adding New Radix UI Components**

1. **Always use Controller for form integration**
2. **Avoid `initialFocus` in nested components**
3. **Test focus behavior in nested dialogs**
4. **Check for version conflicts after updates**

### **Emergency Fix**
If you encounter recursion errors:

1. Check versions: `npm ls @radix-ui/react-focus-scope`
2. Clean install: `rm -rf node_modules && pnpm install`
3. Verify overrides are working
4. Test the specific component causing issues

---
**Last Updated:** January 2025 - Fixed FollowUpModal recursion issue 