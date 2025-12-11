# Responsive Design Updates

## Background Image Fix (Mobile)
- Changed `background-attachment` from `fixed` to `scroll` on mobile devices (≤720px)
- Background position changed from `fixed` to `absolute` for mobile view
- This prevents performance issues and parallax breaking on mobile/tablet

## Font Scaling (Fluid Typography)
All text now uses `clamp()` for responsive sizing:
- **Heading (h1)**: `clamp(28px, 5vw, 48px)` - Scales between 28px and 48px
- **Body text**: `clamp(12px, 2vw, 16px)` - Scales between 12px and 16px
- **Button**: `clamp(12px, 1.5vw, 14px)` - Scales between 12px and 14px
- **Navigation**: `clamp(12px, 1.5vw, 14px)` - Scales between 12px and 14px
- **Language toggle**: `clamp(11px, 2vw, 13px)` - Scales between 11px and 13px

## Responsive Breakpoints

### Desktop (≥980px)
- Full hero layout with image on the right
- Fixed background image with parallax effect
- Normal navigation menu visible

### Tablet (768px - 979px)
- Hero layout adjusts with better spacing
- Background remains fixed with scroll fallback
- Reduced padding and gaps for better mobile space usage
- Cover image max-width: 380px

### Mobile (≤720px)
- Single column layout for hero
- Background uses scroll instead of fixed (critical for mobile)
- Burger menu visible, nav links hidden
- Better touch targets (padding adjusted)
- Reduced image sizes (280px max-width)
- Improved font sizes with clamp()

### Small Mobile (≤480px)
- Extra small image (220px max-width)
- Brand logo reduced in size
- Further optimized spacing and padding
- Mobile links with better touch target size

## Touch Target Improvements
- Button padding: `12px 26px` → optimized for mobile with `14px 28px` on small screens
- Burger menu padding: increased to `12px`
- Language button padding: increased to `6px 10px`

## CSS Variables Updated
- `--page-padding` remains flexible and viewport-responsive
- All breakpoints use consistent padding strategy (4vw)

## Testing Recommendations
- Test on iPhone 12/13/14 (390px width)
- Test on iPad (768px width)
- Test on Android devices (360px, 412px widths)
- Verify parallax effect works on desktop
- Verify background scrolls smoothly on mobile (not fixed)
