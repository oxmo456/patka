const workingDirectory = process.argv.slice(2).find((argument) => !argument.startsWith('--'));

if (workingDirectory !== undefined) {
  process.chdir(workingDirectory);
}

await import('./main.ts');
