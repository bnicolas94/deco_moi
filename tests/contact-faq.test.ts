import assert from 'node:assert/strict';
import test from 'node:test';
import { contactFaqConfigSchema, DEFAULT_CONTACT_FAQ } from '../src/lib/config/contactFaq.ts';

test('la configuración inicial de preguntas frecuentes es válida', () => {
    const result = contactFaqConfigSchema.safeParse(DEFAULT_CONTACT_FAQ);

    assert.equal(result.success, true);
    assert.equal(DEFAULT_CONTACT_FAQ.items.length, 4);
});

test('rechaza preguntas vacías e identificadores repetidos', () => {
    const result = contactFaqConfigSchema.safeParse({
        enabled: true,
        title: 'Preguntas frecuentes',
        intro: '',
        items: [
            { id: 'repetida', question: '', answer: 'Respuesta', isActive: true, order: 1 },
            { id: 'repetida', question: 'Otra pregunta', answer: 'Respuesta', isActive: true, order: 2 },
        ],
    });

    assert.equal(result.success, false);
    if (!result.success) {
        assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'items.0.question'));
        assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'items.1.id'));
    }
});

test('normaliza los espacios antes de guardar el contenido', () => {
    const result = contactFaqConfigSchema.parse({
        enabled: true,
        title: '  Ayuda  ',
        intro: '  Texto introductorio  ',
        items: [
            { id: '  consulta  ', question: '  ¿Pregunta?  ', answer: '  Respuesta  ', isActive: true, order: 1 },
        ],
    });

    assert.equal(result.title, 'Ayuda');
    assert.equal(result.intro, 'Texto introductorio');
    assert.equal(result.items[0].question, '¿Pregunta?');
    assert.equal(result.items[0].answer, 'Respuesta');
});
