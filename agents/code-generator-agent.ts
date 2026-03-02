// code-generator-agent.ts

// This module provides a code generation functionality.

export class CodeGenerator {
    static generateCode(template: string, data: Record<string, string>): string {
        let code = template;
        for (const key in data) {
            const placeholder = `{{${key}}}`;
            code = code.replace(new RegExp(placeholder, 'g'), data[key]);
        }
        return code;
    }
}

// Example usage:
// const template = 'function {{name}}() { return {{value}}; }';
// const data = { name: 'testFunction', value: 42 };
// console.log(CodeGenerator.generateCode(template, data));