import {describe, expect, it} from 'vitest';
import {objectJsonSchemaLLMManual} from './object-json-schema-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from './property-json-schema-llm-manual.ts';

type Product = {
  readonly productId: number;
};

describe('objectJsonSchemaLLMManual', () => {
  it('describes an object with a title, a description and its properties', () => {
    expect(
      objectJsonSchemaLLMManual<Product>('Product', "A product from Acme's catalog", {
        productId: propertyJsonSchemaLLMManual('number', 'The identifier.'),
      }),
    ).toEqual({
      type: 'ObjectJsonSchemaLLMManual',
      title: 'Product',
      description: "A product from Acme's catalog",
      properties: {productId: {value: 'number', description: 'The identifier.'}},
    });
  });
});
