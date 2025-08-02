# Chakra UI Compatibility Fix Patterns

## Issues Found

The Tanzanite integration code uses older Chakra UI patterns that need to be updated to match the current v3.8.0 implementation in this codebase.

## Required Pattern Changes

### 1. Toast Usage
**Old pattern (incorrect):**
```typescript
const showToast = useCustomToast()
showToast("Success!", "Item created successfully.", "success")
```

**New pattern (correct):**
```typescript
const { showSuccessToast } = useCustomToast()
showSuccessToast("Item created successfully.")

// For errors, use:
import { handleError } from "../utils"
onError: handleError
```

### 2. Form Components
**Old pattern (incorrect):**
```typescript
import { FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/react"
<FormControl isRequired isInvalid={!!errors.field}>
  <FormLabel htmlFor="field">Field Label</FormLabel>
  <Input {...register("field")} />
  <FormErrorMessage>{errors.field?.message}</FormErrorMessage>
</FormControl>
```

**New pattern (correct):**
```typescript
import { Field } from "../ui/field"
<Field
  required
  invalid={!!errors.field}
  errorText={errors.field?.message}
  label="Field Label"
>
  <Input {...register("field")} />
</Field>
```

### 3. Disclosure Hook
**Old pattern (incorrect):**
```typescript
const { isOpen, onOpen, onClose } = useDisclosure()
```

**New pattern (correct):**
```typescript
const { open, onOpen, onClose } = useDisclosure()
```

### 4. Dialog Components
**Old pattern (incorrect):**
```typescript
import { AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter } from "@chakra-ui/react"
<AlertDialog isOpen={isOpen} onClose={onClose}>
  <AlertDialogOverlay>
    <AlertDialogContent>
      <AlertDialogHeader>Title</AlertDialogHeader>
      <AlertDialogBody>Content</AlertDialogBody>
      <AlertDialogFooter>Actions</AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialogOverlay>
</AlertDialog>
```

**New pattern (correct):**
```typescript
import { DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle } from "../ui/dialog"
<DialogRoot open={open} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <DialogBody>Content</DialogBody>
    <DialogFooter>Actions</DialogFooter>
  </DialogContent>
</DialogRoot>
```

### 5. Button Props
**Old pattern (incorrect):**
```typescript
<Button isLoading={isSubmitting} leftIcon={<FiPlus />}>
  Submit
</Button>
```

**New pattern (correct):**
```typescript
<Button loading={isSubmitting}>
  <FiPlus />
  Submit
</Button>
```

### 6. Input Components
**Old pattern (incorrect):**
```typescript
import { InputGroup, InputRightElement } from "@chakra-ui/react"
<InputGroup>
  <Input placeholder="Search..." />
  <InputRightElement>
    <FiSearch />
  </InputRightElement>
</InputGroup>
```

**New pattern (correct):**
```typescript
import { InputGroup } from "../ui/input-group"
<InputGroup endElement={<FiSearch />}>
  <Input placeholder="Search..." />
</InputGroup>
```

### 7. NumberInput Components
**Old pattern (incorrect):**
```typescript
import { NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper } from "@chakra-ui/react"
<NumberInput>
  <NumberInputField />
  <NumberInputStepper>
    <NumberIncrementStepper />
    <NumberDecrementStepper />
  </NumberInputStepper>
</NumberInput>
```

**New pattern (correct):**
```typescript
import { NumberInputField, NumberInputRoot } from "../ui/number-input"
<NumberInputRoot>
  <NumberInputField />
</NumberInputRoot>
```

### 8. Table Components
**Status:** Already working correctly in existing files
- Table, Thead, Tbody, Tr, Th, Td are available from "@chakra-ui/react"

### 9. VStack Props
**Old pattern (incorrect):**
```typescript
<VStack spacing={6}>
```

**New pattern (correct):**
```typescript
<VStack gap={6}>
```

## Files That Need Updates

1. `/routes/assessments.tsx` - ✅ Partially started
2. `/routes/assessments/create.tsx`
3. `/routes/assessments/$assessmentId/edit.tsx`
4. `/routes/questions.tsx` - ✅ Partially started
5. `/routes/questions/create.tsx`
6. `/routes/questions/$questionId/edit.tsx`

## Implementation Strategy

1. **Update one file completely** as a template
2. **Test build** after each file
3. **Apply same patterns** to remaining files
4. **Focus on most critical paths first** (create/edit forms)

## Current Status

- ✅ Identified correct patterns from working files
- ⚠️ Started partial fixes in assessments.tsx
- ❌ Need systematic application across all files

## Priority Order

1. **Questions create form** - Most commonly used by students
2. **Questions list view** - Main help request interface
3. **Assessment create form** - Used by lecturers
4. **Assessment list view** - Assessment management
5. **Edit forms** - Secondary functionality