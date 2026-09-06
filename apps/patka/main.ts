import { extractInferenceClientOption } from "./inference/patka-inference.ts";
import { Patka } from "./patka.ts";

new Patka(extractInferenceClientOption(process.argv));
