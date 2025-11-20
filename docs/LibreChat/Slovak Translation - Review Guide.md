# Slovak Translation - Review Guide

## ✅ What Has Been Completed

A foundational Slovak translation has been created with **1,333 entries** (100% key coverage).

**Translation approach used:**
- ~200 common UI terms automatically translated
- All JSON structure and keys preserved
- All `{{placeholders}}` preserved correctly
- Technical terms kept in English where appropriate
- Complex/contextual entries left in English for your review

**File location:** `/home/user/Libre/client/src/locales/sk/translation.json`

**Validation status:**
- ✅ JSON syntax valid
- ✅ All 1,333 keys from English translation present
- ✅ No broken placeholders
- ✅ UTF-8 Slovak characters properly encoded

## 📝 What Needs Your Review

As a native Slovak speaker, you need to review and perfect the translation by:

1. **Translating untranslated entries** - Many complex descriptions and messages remain in English
2. **Verifying Slovak grammar** - Check for proper Slovak language usage
3. **Checking formality level** - Ensure appropriate use of:
   - Informal "ty" (2nd person singular) for user actions: "Nahraj", "Vytvor", "Uprav"
   - Formal "vy" (2nd person plural) for system messages and errors
4. **Verifying technical terminology** - Ensure technical terms are appropriate for Slovak users
5. **Checking context** - Some translations may need adjustment based on context

## 🔍 How to Review

### Option 1: Manual Review (Recommended for Quality)

1. **Open the file:**
   ```bash
   code /home/user/Libre/client/src/locales/sk/translation.json
   # or
   nano /home/user/Libre/client/src/locales/sk/translation.json
   ```

2. **Search for untranslated entries** - Look for English text and translate to Slovak

3. **Focus on these entry types first:**
   - Error messages (com_error_*)
   - Descriptions (com_*_description)
   - Placeholders (com_*_placeholder)
   - Help text and tooltips
   - User-facing messages

4. **Save the file** when done

### Option 2: Batch Review with Tools

Use `jq` to extract untranslated entries for batch translation:

```bash
# Find all entries that are likely still in English
jq -r 'to_entries | .[] | select(.value | test("^[A-Z].*[a-z]") and test("[a-z]{4,}")) | "\(.key): \(.value)"' \
  client/src/locales/sk/translation.json > /tmp/to_translate.txt

# Review and translate in your editor
code /tmp/to_translate.txt

# After translating, provide the file to me for integration
```

## 📋 Examples of What to Review

### Already Translated (for reference)
```json
{
  "com_ui_cancel": "Zrušiť",
  "com_ui_save": "Uložiť",
  "com_ui_delete": "Odstrániť",
  "com_ui_upload": "Nahrať",
  "com_nav_settings": "Nastavenia",
  "com_agents_error_network_title": "Problém s pripojením",
  "com_agents_category_finance": "Financie"
}
```

### Still in English (needs translation)
```json
{
  "com_agents_all_description": "Browse all shared agents across all categories",
  "com_agents_error_bad_request_message": "The request could not be processed.",
  "com_ui_2fa_account_security": "Two-factor authentication adds an extra layer of security to your account",
  "com_agents_description_placeholder": "Optional: Describe your Agent here"
}
```

### Suggested Slovak Translations (for your review)
```json
{
  "com_agents_all_description": "Prehliadať všetkých zdieľaných agentov vo všetkých kategóriách",
  "com_agents_error_bad_request_message": "Požiadavku nebolo možné spracovať.",
  "com_ui_2fa_account_security": "Dvojfaktorová autentifikácia pridáva dodatočnú vrstvu zabezpečenia k vášmu účtu",
  "com_agents_description_placeholder": "Voliteľné: Popíšte tu svojho agenta"
}
```

## ⚠️ Important Rules

### DO NOT Modify:
- ✅ JSON keys (left side of `:`)
- ✅ Placeholders like `{{name}}`, `{{count}}`, `{{0}}`, `{{description}}`
- ✅ HTML tags like `<0>`, `</0>`, `<1>`, `</1>`
- ✅ JSON structure (commas, brackets, quotes)

### Example - Correct Placeholder Preservation:
```json
{
  "com_agents_agent_card_label": "{{name}} agent. {{description}}"
  // Slovak version must keep {{name}} and {{description}} unchanged:
  "com_agents_agent_card_label": "Agent {{name}}. {{description}}"
}
```

### DO Modify:
- ✅ English text values (right side of `:`)
- ✅ Word order (Slovak grammar may require different order)
- ✅ Formality level (ty vs vy)

## 🎯 Translation Style Guide

### Formality Guidelines

**Use informal "ty" (2nd person singular) for:**
- User actions: "Nahraj súbor", "Vytvor agenta", "Uprav nastavenia"
- Button labels: "Uložiť", "Zrušiť", "Odstrániť"
- Instructions: "Klikni sem", "Vyber možnosť"

**Use formal "vy" (2nd person plural) for:**
- Error messages: "Vyskytla sa chyba", "Nepodarilo sa pripojiť"
- System messages: "Váš účet bol vytvorený"
- Terms of service / legal text

### Technical Terms

**Keep in English (or use Slovak equivalent if natural):**
- API, Token, Model, Endpoint
- Chat (or "konverzácia" if context allows)
- Prompt (or "výzva" if context allows)
- Agent (keep as "Agent")
- Assistant (keep as "Assistant")
- Code Interpreter (keep as-is - technical feature name)
- MCP (Model Context Protocol - keep acronym)

**Translate if natural:**
- Settings → Nastavenia
- File → Súbor
- Upload → Nahrať
- Delete → Odstrániť
- Cancel → Zrušiť

### Example Translations for Common Patterns

| English Pattern | Slovak Translation |
|----------------|-------------------|
| "There was an error..." | "Vyskytla sa chyba..." |
| "Successfully created" | "Úspešne vytvorené" |
| "Are you sure?" | "Ste si istý?" (or "si istý?" if informal context) |
| "Loading..." | "Načítava sa..." |
| "Please try again" | "Prosím skúste znova" |
| "Something went wrong" | "Niečo sa pokazilo" |
| "Click here" | "Kliknite tu" (formal) / "Klikni tu" (informal) |
| "Optional: " | "Voliteľné: " |

## 📊 Translation Progress Estimate

Based on the foundational translation:

- ✅ **~200 common UI terms**: Fully translated
- 📝 **~400 descriptive texts**: Need review/translation
- 📝 **~300 error messages**: Need review/translation
- 📝 **~200 help/tooltip texts**: Need review/translation
- ✅ **~233 already perfect**: Technical terms, placeholders, etc.

**Estimated review time:** 2-4 hours for thorough review and perfection

## ✅ Validation Checklist

Before submitting your completed translation, verify:

- [ ] All English entries have been translated to Slovak
- [ ] All `{{placeholders}}` are preserved exactly
- [ ] Slovak grammar is correct
- [ ] Formality level is appropriate (ty vs vy)
- [ ] Technical terms are appropriate
- [ ] JSON syntax is valid (test with `jq empty translation.json`)
- [ ] No broken quotes or commas
- [ ] UTF-8 encoding is correct (Slovak characters display properly)

## 🚀 Next Steps After Review

Once you've completed your review and perfected the translation:

1. **Save the file**: `/home/user/Libre/client/src/locales/sk/translation.json`

2. **Notify me** that the translation is complete

3. **I will then**:
   - Validate JSON syntax and structure
   - Verify all keys are present
   - Check for broken placeholders
   - Integrate Slovak into i18n configuration
   - Update language selector in UI
   - Build frontend with Slovak support
   - Rebuild Docker image
   - Guide you through testing

4. **You will test**:
   - Select "Slovenčina" in Settings → General → Language
   - Verify UI displays in Slovak
   - Check critical workflows (chat, settings, file upload)
   - Report any issues or mistranslations

## 💡 Tips for Efficient Review

### Priority Order

1. **High Priority** - User-facing, frequently seen:
   - Navigation menu items (com_nav_*)
   - UI buttons and actions (com_ui_*)
   - Error messages (com_error_*)
   - Settings labels (com_nav_setting_*)

2. **Medium Priority** - Feature-specific:
   - Agent marketplace (com_agents_*)
   - File management (com_files_*)
   - Conversation management (com_convo_*)
   - Authentication (com_auth_*)

3. **Low Priority** - Less frequently seen:
   - Admin features (com_admin_*)
   - Advanced settings
   - Developer features

### Quick Review Script

```bash
# Count untranslated entries (rough estimate)
grep -E '": "[A-Z][a-z]{3,}.*"' client/src/locales/sk/translation.json | wc -l

# Find entries with "Error" still in English
jq -r 'to_entries | .[] | select(.value | contains("Error")) | "\(.key): \(.value)"' \
  client/src/locales/sk/translation.json

# Find entries with "Please" (likely need translation)
jq -r 'to_entries | .[] | select(.value | contains("Please")) | "\(.key): \(.value)"' \
  client/src/locales/sk/translation.json
```

## 📞 Questions or Issues?

If you encounter:
- **Unclear context** - Let me know which keys need context explanation
- **Technical term questions** - Ask about appropriate Slovak terminology
- **Grammar doubts** - I can help verify Slovak grammar patterns
- **Placeholder questions** - I'll explain what each placeholder represents

---

**Remember:** This is YOUR translation as a native speaker. The foundation provides a starting point, but your expertise will make it natural and high-quality for Slovak users.

**Take your time** - Quality is more important than speed. A well-translated UI significantly improves user experience.
