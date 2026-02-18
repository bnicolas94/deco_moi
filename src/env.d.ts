/// <reference path="../.astro/types.d.ts" />

declare namespace App {
    interface Locals {
        session: import('./lib/auth').Session | null;
        user: import('./lib/auth').User | null;
    }
}
