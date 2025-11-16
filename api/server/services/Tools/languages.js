/**
 * Judge0 CE Language Mappings
 *
 * Maps friendly language names to Judge0 language IDs
 * Supports 70+ programming languages
 *
 * Reference: https://ce.judge0.com/#statuses-and-languages-language-get
 */

const LANGUAGES = {
  // Popular Languages
  'python': 71,
  'python3': 71,
  'py': 71,

  'javascript': 63,
  'js': 63,
  'node': 63,
  'nodejs': 63,

  'typescript': 74,
  'ts': 74,

  'java': 62,

  'c': 50,

  'cpp': 54,
  'c++': 54,
  'cplusplus': 54,

  'csharp': 51,
  'c#': 51,
  'cs': 51,

  'go': 60,
  'golang': 60,

  'rust': 73,
  'rs': 73,

  'php': 68,

  'ruby': 72,
  'rb': 72,

  'swift': 83,

  'kotlin': 78,
  'kt': 78,

  'r': 80,

  'bash': 46,
  'sh': 46,
  'shell': 46,

  'sql': 82,
  'sqlite': 82,

  'perl': 85,
  'pl': 85,

  // Systems Programming
  'assembly-nasm': 45,
  'nasm': 45,
  'asm': 45,

  // Scripting Languages
  'lua': 64,

  'groovy': 88,

  'scala': 81,

  // Functional Languages
  'haskell': 61,
  'hs': 61,

  'clojure': 86,
  'clj': 86,

  'elixir': 57,
  'ex': 57,

  'erlang': 58,
  'erl': 58,

  'ocaml': 65,
  'ml': 65,

  'fsharp': 87,
  'f#': 87,
  'fs': 87,

  // Legacy/Classic Languages
  'fortran': 59,
  'f90': 59,
  'f95': 59,

  'cobol': 77,
  'cob': 77,

  'pascal': 67,
  'pas': 67,

  'lisp': 55,
  'commonlisp': 55,

  'd': 56,

  // JVM Languages
  'java8': 62,

  // Web Languages
  'html': 63,  // Executed as JavaScript

  // Data Languages
  'prolog': 69,
  'pro': 69,

  // Other Languages
  'objective-c': 79,
  'objc': 79,

  'vbnet': 84,
  'visualbasic': 84,
  'vb': 84,
};

/**
 * Language metadata including file extensions and descriptions
 */
const LANGUAGE_INFO = {
  71: {
    name: 'Python',
    version: '3.8.1',
    extensions: ['.py'],
    description: 'Python 3 - General purpose programming language'
  },
  63: {
    name: 'JavaScript',
    version: 'Node.js 12.14.0',
    extensions: ['.js'],
    description: 'JavaScript (Node.js) - Web and server-side programming'
  },
  74: {
    name: 'TypeScript',
    version: '3.7.4',
    extensions: ['.ts'],
    description: 'TypeScript - Typed superset of JavaScript'
  },
  62: {
    name: 'Java',
    version: 'OpenJDK 13.0.1',
    extensions: ['.java'],
    description: 'Java - Enterprise and Android development'
  },
  50: {
    name: 'C',
    version: 'GCC 9.2.0',
    extensions: ['.c'],
    description: 'C - Systems programming language'
  },
  54: {
    name: 'C++',
    version: 'G++ 9.2.0',
    extensions: ['.cpp', '.cc', '.cxx'],
    description: 'C++ - Object-oriented systems programming'
  },
  51: {
    name: 'C#',
    version: 'Mono 6.6.0.161',
    extensions: ['.cs'],
    description: 'C# - .NET framework language'
  },
  60: {
    name: 'Go',
    version: '1.13.5',
    extensions: ['.go'],
    description: 'Go - Google\'s systems programming language'
  },
  73: {
    name: 'Rust',
    version: '1.40.0',
    extensions: ['.rs'],
    description: 'Rust - Memory-safe systems programming'
  },
  68: {
    name: 'PHP',
    version: '7.4.1',
    extensions: ['.php'],
    description: 'PHP - Web development language'
  },
  72: {
    name: 'Ruby',
    version: '2.7.0',
    extensions: ['.rb'],
    description: 'Ruby - Dynamic scripting language'
  },
  83: {
    name: 'Swift',
    version: '5.2.3',
    extensions: ['.swift'],
    description: 'Swift - Apple\'s programming language'
  },
  78: {
    name: 'Kotlin',
    version: '1.3.70',
    extensions: ['.kt'],
    description: 'Kotlin - Modern JVM language'
  },
  80: {
    name: 'R',
    version: '4.0.0',
    extensions: ['.r', '.R'],
    description: 'R - Statistical computing and graphics'
  },
  46: {
    name: 'Bash',
    version: '5.0.0',
    extensions: ['.sh', '.bash'],
    description: 'Bash - Unix shell scripting'
  },
  82: {
    name: 'SQL',
    version: 'SQLite 3.27.2',
    extensions: ['.sql'],
    description: 'SQL - Database query language'
  },
  85: {
    name: 'Perl',
    version: '5.28.1',
    extensions: ['.pl'],
    description: 'Perl - Text processing and system administration'
  },
};

/**
 * Detect language from code content or file extension
 * @param {string} code - The code to analyze
 * @param {string} [filename] - Optional filename with extension
 * @returns {number|null} Judge0 language ID
 */
function detectLanguage(code, filename = '') {
  // Try filename extension first
  if (filename) {
    const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (ext) {
      for (const [langId, info] of Object.entries(LANGUAGE_INFO)) {
        if (info.extensions.includes(ext)) {
          return parseInt(langId);
        }
      }
    }
  }

  // Detect from code patterns
  const codeStart = code.trim().substring(0, 200).toLowerCase();

  // Python
  if (codeStart.match(/^(import |from |def |class |#!\/.*python)/)) {
    return 71;
  }

  // JavaScript/TypeScript
  if (codeStart.match(/^(const |let |var |function |import |export |\/\/ |\/\*)/)) {
    if (code.includes(': string') || code.includes(': number') || code.includes('interface ')) {
      return 74; // TypeScript
    }
    return 63; // JavaScript
  }

  // Java
  if (codeStart.match(/^(public |private |class |import java)/)) {
    return 62;
  }

  // C/C++
  if (codeStart.match(/#include </)) {
    if (code.includes('iostream') || code.includes('std::')) {
      return 54; // C++
    }
    return 50; // C
  }

  // C#
  if (codeStart.match(/^(using |namespace |public class)/)) {
    return 51;
  }

  // Go
  if (codeStart.match(/^(package |import |func )/)) {
    return 60;
  }

  // Rust
  if (codeStart.match(/^(fn |use |mod |pub )/)) {
    return 73;
  }

  // PHP
  if (codeStart.match(/^<\?php/)) {
    return 68;
  }

  // Ruby
  if (codeStart.match(/^(require |class |def |#!\/.*ruby)/)) {
    return 72;
  }

  // Bash
  if (codeStart.match(/^(#!\/bin\/(ba)?sh|echo |if \[)/)) {
    return 46;
  }

  // R
  if (codeStart.match(/^(library\(|#.*R script)/i)) {
    return 80;
  }

  // SQL
  if (codeStart.match(/^(select |insert |update |delete |create table)/i)) {
    return 82;
  }

  return null; // Unknown
}

/**
 * Get language ID from name
 * @param {string} languageName - Language name (e.g., "python", "javascript")
 * @returns {number|null} Judge0 language ID
 */
function getLanguageId(languageName) {
  if (!languageName) return null;
  const normalized = languageName.toLowerCase().trim();
  return LANGUAGES[normalized] || null;
}

/**
 * Get language name from ID
 * @param {number} languageId - Judge0 language ID
 * @returns {string} Language name
 */
function getLanguageName(languageId) {
  return LANGUAGE_INFO[languageId]?.name || `Language ${languageId}`;
}

/**
 * Get all supported languages for documentation
 * @returns {Array<{name: string, aliases: string[], id: number}>}
 */
function getSupportedLanguages() {
  const languageMap = new Map();

  for (const [alias, id] of Object.entries(LANGUAGES)) {
    if (!languageMap.has(id)) {
      languageMap.set(id, {
        name: LANGUAGE_INFO[id]?.name || `Language ${id}`,
        aliases: [],
        id
      });
    }
    languageMap.get(id).aliases.push(alias);
  }

  return Array.from(languageMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

module.exports = {
  LANGUAGES,
  LANGUAGE_INFO,
  detectLanguage,
  getLanguageId,
  getLanguageName,
  getSupportedLanguages,
};
