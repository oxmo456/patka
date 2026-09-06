import { Patka } from "./patka.ts";
import { extractInferenceClientOption } from "./patka-inference.ts";

new Patka(extractInferenceClientOption(process.argv));
