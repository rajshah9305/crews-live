// server/src/utils/index.ts
import { GenerationRequest } from "../../../shared/types.js";

// Utility functions for the CrewCodeGen application

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const getFileExtension = (language: string): string => {
  const extensions: Record<string, string> = {
    'javascript': 'js',
    'typescript': 'ts',
    'python': 'py',
    'java': 'java',
    'csharp': 'cs',
    'cpp': 'cpp',
    'c': 'c',
    'go': 'go',
    'rust': 'rs',
    'php': 'php',
    'ruby': 'rb',
    'swift': 'swift',
    'kotlin': 'kt'
  };
  
  return extensions[language.toLowerCase()] || 'txt';
};

export const generateJobId = (): string => {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const validateGenerationRequest = (request: Partial<GenerationRequest>): string[] => {
  const errors: string[] = [];
  
  if (!request.requirements || request.requirements.trim().length === 0) {
    errors.push('Requirements are required and cannot be empty');
  }
  
  if (!request.framework || request.framework.trim().length === 0) {
    errors.push('Framework is required and cannot be empty');
  }
  
  if (!request.language || request.language.trim().length === 0) {
    errors.push('Language is required and cannot be empty');
  }
  
  if (request.requirements && request.requirements.length > 10000) {
    errors.push('Requirements are too long (maximum 10,000 characters)');
  }
  
  return errors;
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .substring(0, 10000); // Limit length
};

export const formatTimestamp = (date: Date = new Date()): string => {
  return date.toISOString();
};

export const createErrorResponse = (message: string, details?: any) => {
  return {
    success: false,
    error: message,
    timestamp: formatTimestamp(),
    ...(details && { details })
  };
};

export const createSuccessResponse = (data: any, message?: string) => {
  return {
    success: true,
    data,
    timestamp: formatTimestamp(),
    ...(message && { message })
  };
};

export const logWithTimestamp = (level: 'info' | 'warn' | 'error', message: string, ...args: any[]) => {
  const timestamp = formatTimestamp();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  switch (level) {
    case 'info':
      console.log(prefix, message, ...args);
      break;
    case 'warn':
      console.warn(prefix, message, ...args);
      break;
    case 'error':
      console.error(prefix, message, ...args);
      break;
  }
};

export const parseFrameworkLanguage = (framework: string, language: string): {
  normalizedFramework: string;
  normalizedLanguage: string;
  isValid: boolean;
} => {
  const supportedFrameworks = [
    'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxtjs',
    'express', 'fastapi', 'django', 'flask', 'spring', 'laravel',
    'rails', 'asp.net', 'gin', 'fiber', 'actix', 'rocket'
  ];
  
  const supportedLanguages = [
    'javascript', 'typescript', 'python', 'java', 'csharp',
    'cpp', 'c', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin'
  ];
  
  const normalizedFramework = framework.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedLanguage = language.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const isValidFramework = supportedFrameworks.some(f => 
    normalizedFramework.includes(f) || f.includes(normalizedFramework)
  );
  
  const isValidLanguage = supportedLanguages.some(l => 
    normalizedLanguage.includes(l) || l.includes(normalizedLanguage)
  );
  
  return {
    normalizedFramework,
    normalizedLanguage,
    isValid: isValidFramework && isValidLanguage
  };
};

export const estimateGenerationTime = (requirements: string, framework: string, language: string): number => {
  // Base time in seconds
  let estimatedTime = 30;
  
  // Adjust based on requirements complexity
  const wordCount = requirements.split(/\s+/).length;
  if (wordCount > 100) estimatedTime += 15;
  if (wordCount > 300) estimatedTime += 15;
  if (wordCount > 500) estimatedTime += 20;
  
  // Adjust based on framework complexity
  const complexFrameworks = ['angular', 'nextjs', 'nuxtjs', 'spring', 'asp.net'];
  if (complexFrameworks.some(f => framework.toLowerCase().includes(f))) {
    estimatedTime += 10;
  }
  
  // Adjust based on language
  const complexLanguages = ['cpp', 'java', 'csharp', 'rust'];
  if (complexLanguages.some(l => language.toLowerCase().includes(l))) {
    estimatedTime += 10;
  }
  
  return Math.min(estimatedTime, 120); // Cap at 2 minutes
};

export const compileCodeFiles = (
  agentOutputs: Array<{ role: string; content: string }>,
  request: GenerationRequest
): Record<string, string> => {
  const files: Record<string, string> = {};
  const fileExtension = getFileExtension(request.language);
  
  agentOutputs.forEach(output => {
    switch (output.role.toLowerCase()) {
      case 'product manager':
        files['PROJECT_SPECIFICATION.md'] = output.content;
        break;
      case 'solution architect':
        files['ARCHITECTURE.md'] = output.content;
        break;
      case 'senior developer':
        files[`main.${fileExtension}`] = output.content;
        files['README.md'] = generateReadme(request, output.content);
        files['package.json'] = generatePackageJson(request);
        break;
      case 'qa engineer':
        files[`tests.${fileExtension}`] = output.content;
        files['TEST_PLAN.md'] = output.content;
        break;
      default:
        files[`${output.role.toLowerCase().replace(/\s+/g, '_')}.md`] = output.content;
    }
  });
  
  return files;
};

const generateReadme = (request: GenerationRequest, codeContent: string): string => {
  return `# ${request.framework} Application

## Description
${request.requirements}

## Technology Stack
- **Framework:** ${request.framework}
- **Language:** ${request.language}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Features
- Production-ready code
- Modern architecture
- Comprehensive testing
- Security best practices

## Generated by CrewCodeGen
This application was generated using AI-powered multi-agent collaboration.
`;
};

const generatePackageJson = (request: GenerationRequest): string => {
  const packageName = request.requirements
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
    
  return JSON.stringify({
    name: packageName || 'generated-app',
    version: '1.0.0',
    description: request.requirements.substring(0, 200),
    main: `main.${getFileExtension(request.language)}`,
    scripts: {
      start: 'node main.js',
      dev: 'nodemon main.js',
      test: 'jest',
      build: 'tsc'
    },
    keywords: [request.framework, request.language, 'generated', 'ai'],
    author: 'CrewCodeGen',
    license: 'MIT'
  }, null, 2);
};

