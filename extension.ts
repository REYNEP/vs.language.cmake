// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {workspace, window, languages, Modes, TextDocument, Position, commands, Disposable, CancellationToken} from 'vscode';
import util  = require('util');
import child_process = require("child_process");

/// strings Helpers
function strContains(word, pattern) {
    return word.indexOf(pattern) >-1;
}

function strEquals(word, pattern) {
    return word == pattern;
}

/// Cmake process helpers

let cmake = (args: string[]): Promise<string> => {
    return new Promise(function(resolve, reject){
        let cmd = child_process.spawn('cmake', args.map(arg=>{return arg.replace(/\r/gm, '');}));
        let stdout : string = '';
        cmd.stdout.on('data', function(data) {    
            var txt: string = data.toString('utf8');
            stdout += txt.replace(/\r/gm, '');
        });
        cmd.on("error", function(error) {
            reject();
        });
        cmd.on('exit', function(code) {
            resolve(stdout);
        });
    });
}




class CMakeService {      
    public cmake_help_command_list = () : Promise<string> => {
        return cmake(['--help-command-list']);
    }
    
    public cmake_help_command = (name:string) : Promise<string> => {
             return this.cmake_help_command_list()
             .then(function(result:string){
                 let contains = result.indexOf(name)>-1 ;
                 return new Promise(function(resolve, reject) {
                     if(contains) {
                         resolve(name);
                     }else {
                         reject('not found');//resolve('');
                     }
                 }); 
             }, function(e){})
             .then(function(n:string){
                 return cmake(['--help-command', n]);
                }, null);
    }
  
    
    public cmake_help_variable_list = () : Promise<string> => {
        return cmake(['--help-variable-list']);
    }
    
    public cmake_help_variable = (name:string) : Promise<string> =>{
        return this.cmake_help_variable_list()
             .then(function(result:string){
                 let contains = result.indexOf(name)>-1 ;
                 return new Promise(function(resolve, reject) {
                     if(contains) {
                         resolve(name);
                     }else {
                         reject('note found');
                     }
                 });
             }, function(e){}).then(function(name:string){return cmake(['--help-variable', name]);}, null);
    }
    
    
    public cmake_help_property_list = () : Promise<string> => {
        return cmake(['--help-property-list']);
    }
    
    public cmake_help_property = (name:string) : Promise<string> =>{
        return this.cmake_help_variable_list()
             .then(function(result:string){
                 let contains = result.indexOf(name)>-1 ;
                 return new Promise(function(resolve, reject) {
                     if(contains) {
                         resolve(name);
                     }else {
                         reject('note found');
                     }
                 });
             }, function(e){}).then(function(name:string){return cmake(['--help-property', name]);}, null);
    }
    
    public cmake_help_module_list = () : Promise<string> => {
        return cmake(['--help-module-list']);
    }
    
    public cmake_help_module = (name:string) : Promise<string> =>{
        return this.cmake_help_variable_list()
             .then(function(result:string){
                 let contains = result.indexOf(name)>-1 ;
                 return new Promise(function(resolve, reject) {
                     if(contains) {
                         resolve(name);
                     }else {
                         reject('note found');
                     }
                 });
             }, function(e){}).then(function(name:string){return cmake(['--help-module', name]);}, null);
    }
    
     
}

// this method is called when your extension is activated. activation is
// controlled by the activation events defined in package.json
export function activate(disposables: Disposable[]) {

    commands.registerCommand('cmake.onlineHelp', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        var editor = window.getActiveTextEditor();
        if (!editor) {
            return; // No open text editor
        }

        // var selection = editor.getSelection();
        // var text = editor.getTextDocument().getTextInRange(selection);
        // shell.openExternal('https://github.com');
    //   let channel = window.getOutputChannel('CMake');
    //  channel.reveal();
    //  channel.appendLine('Hello From Cmake Extension');
    //  channel.appendLine('#Hello From Cmake Extension');
    //  channel.appendLine('#Hello <b>From</b> Cmake Extension');
    //  channel.appendLine('http://www.google.fr');

        // Display a message box to the user
        //window.showInformationMessage('Selected characters: ' + text.length);
    });
    
     
   
    
    Modes.registerMonarchDefinition('cmake', new CMakeLanguageDef());

    Modes.SuggestSupport.register('cmake', new CMakeSuggestionSupport());

    Modes.ExtraInfoSupport.register('cmake', new CMakeExtraInfoSupport());


}

// Show Tooltip on mouse over
class CMakeExtraInfoSupport implements Modes.IExtraInfoSupport {
    private computeInfoHelper(cmake_get_help, value, range) {
        return new Promise(function(resolve, reject) {
            let cmd = cmake_get_help(value);
            cmd.then(function(stdout) {
                let documentationContent = stdout.split('\n').map(function(line: string) {
                    return { className: 'documentation', text: line }
                });
                var extraInfoResult = {
                    value: '',
                    range: range,
                    className: 'typeInfo',
                    htmlContent: [{ className: 'type', text: value }].concat(documentationContent)
                };
                resolve(extraInfoResult);
            }).catch(function(e) { 
                console.log(e);
                reject(); 
            });
        });
    }
    public computeInfo(document: TextDocument, position: Position, token: CancellationToken) /*: Thenable<IComputeExtraInfoResult>*/ {
        let range = document.getWordRangeAtPosition(position);
        let value = document.getTextInRange(range);
        let promises = {
            'function' : (name : string)=>{ 
                let service = new CMakeService();
                return service.cmake_help_command(name);
            },
            'module' : (name : string)=>{ 
                let service = new CMakeService();
                return service.cmake_help_module(name);
            },
            'variable' : (name : string)=>{ 
                let service = new CMakeService();
                return service.cmake_help_variable(name);
            }
            ,
            'property' : (name : string)=>{ 
                let service = new CMakeService();
                return service.cmake_help_property(name);
            }
        };
        
        return Promise.all([
            commandsSuggestionsExact(value),
            variablesSuggestionsExact(value),
            modulesSuggestionsExact(value),
            propertiesSuggestionsExact(value),
        ]).then(function(results){
             var suggestions = Array.prototype.concat.apply([], results);
             if(suggestions.length == 0) {
                 return null;
             }
             let suggestion = suggestions[0];
             
            return promises[suggestion.type](suggestion.label).then(function(result:string){    
                let lines = result.split('\n');
                
                lines = lines.slice(2, Math.min(20, lines.length));
               let documentationContent = lines.map(function(line: string) {
                return { className: 'documentation', text: line }
               });
               var extraInfoResult = {
                    value: value,
                    range: range,
                    className: 'typeInfo',
                    htmlContent: [{ className: 'type', text: value }].concat(documentationContent)
                };        
                return extraInfoResult;
            });
        });
    }
}



  function suggestionsHelper(cmake_cmd, currentWord: string, type:string, suffix:string, matchPredicate) {
         return new Promise(function(resolve, reject) {
            cmake_cmd.then(function(stdout: string) {
                let commands = stdout.split('\n').filter(function(v){return matchPredicate(v, currentWord)});
                if(commands.length>0) {
                    let suggestions = commands.map(function(command_name){
                        return {
                            'type' : type,
                            'label' : command_name,
                            'codeSnippet': command_name+suffix
                        };
                    });
                    resolve(suggestions);
                }else {
                    resolve([]);
                }
                
            }).catch(function(err) { 
                reject(err); 
            });
        });
    }

  function commandsSuggestions(currentWord: string) {
      let service = new CMakeService();
      let cmd = service.cmake_help_command_list();
      return suggestionsHelper(cmd, currentWord, 'function', '({{}})', strContains);
  }

  function variablesSuggestions(currentWord: string) {
      let service = new CMakeService();
      let cmd = service.cmake_help_variable_list();
      return suggestionsHelper(cmd, currentWord, 'variable', '', strContains);
  }


  function propertiesSuggestions(currentWord: string) {
      let service = new CMakeService();
      let cmd = service.cmake_help_property_list();
      return suggestionsHelper(cmd, currentWord, 'property', '', strContains);
  }

  function modulesSuggestions(currentWord: string) {
      let service = new CMakeService();
      let cmd = service.cmake_help_module_list();
      return suggestionsHelper(cmd, currentWord, 'module', '', strContains);
  }
    
  function commandsSuggestionsExact(currentWord: string) {
      let service = new CMakeService();
      let cmd = service.cmake_help_command_list();
      return suggestionsHelper(cmd, currentWord, 'function', '({{}})', strEquals);
  }

  function variablesSuggestionsExact(currentWord: string) {
      let service = new CMakeService();
      let cmd = service.cmake_help_variable_list();
      return suggestionsHelper(cmd, currentWord, 'variable', '', strEquals);
  }


  function propertiesSuggestionsExact(currentWord: string) {
      let service = new CMakeService();
      let cmd = service.cmake_help_property_list();
      return suggestionsHelper(cmd, currentWord, 'property', '', strEquals);
  }

  function modulesSuggestionsExact(currentWord: string) {
      let service = new CMakeService();
      let cmd = service.cmake_help_module_list();
      return suggestionsHelper(cmd, currentWord, 'module', '', strEquals);
  }
    
class CMakeSuggestionSupport implements Modes.ISuggestSupport {
    public triggerCharacters: string[];
    public excludeTokens: string[] = ['string', 'comment', 'numeric'];

   
    public suggest(document: TextDocument, position: Position, token: CancellationToken) {
        let wordAtPosition = document.getWordRangeAtPosition(position);
        var currentWord = '';
        if (wordAtPosition && wordAtPosition.start.character < position.character) {
            var word = document.getTextInRange(wordAtPosition);
            currentWord = word.substr(0, position.character - wordAtPosition.start.character);
        }
        
        return new Promise(function(resolve, reject) {
            Promise.all([
                commandsSuggestions(currentWord),
                variablesSuggestions(currentWord),
                propertiesSuggestions(currentWord),
                modulesSuggestions(currentWord)
            ]).then(function(results){
                var suggestions = Array.prototype.concat.apply([], results);
                resolve([{
                        'currentWord': currentWord,
                        'suggestions': suggestions}]);
            }).catch(err=>{ reject(err); });
        });
    }
   
    public getSuggestionDetails(document: TextDocument, position: Position, suggestion:Modes.ISuggestion, token: CancellationToken) {
        let promises = {
            'function' : (name : string)=>{ 
                let service = new CMakeService();
                return service.cmake_help_command(name);
            },
            'module' : (name : string)=>{ 
                let service = new CMakeService();
                return service.cmake_help_module(name);
            },
            'variable' : (name : string)=>{ 
                let service = new CMakeService();
                return service.cmake_help_variable(name);
            }
            ,
            'property' : (name : string)=>{ 
                let service = new CMakeService();
                return service.cmake_help_property(name);
            }
        };
        return promises[suggestion.type](suggestion.label).then(function(result:string){            
            suggestion.documentationLabel = result.split('\n')[3];
            return suggestion;
        });
       
     }
}


// CMake Language Definition

class CMakeLanguageDef {

        public name:string = 'cmake';
        public displayName:string= 'Cmake';
        public ignoreCase: boolean = true;
        public lineComment: string = '#';
        public autoClosingPairs:string[][] = [
            ['{', '}'],
            ['"', '"']];
       public keywords :string[] = [
           'if', 'endif',
           'foreach', 'endforeach',
           'function', 'endfunction',
           'macro', 'endmacro',
           'include',
           'set',
           'project'
       ];
        public brackets = [
            { token: 'delimiter.parenthesis', open: '(', close: ')' },
        ];
        public textAfterBrackets:boolean = true;
        public variable= /\$\{\w+\}/;
       public  enhancedBrackets = [           
            {
                openTrigger: '\)',
                open: /if\((\w*)\)/i,
                closeComplete: 'endif\($1\)',
                matchCase: true,
                closeTrigger: '\)',
                close: /endif\($1\)$/,
                tokenType: 'keyword.tag-if'
            },
            {
                openTrigger: '\)',
                open: /foreach\((\w*)\)/i,
                closeComplete: 'endforeach\($1\)',
                matchCase: true,
                closeTrigger: '\)',
                close: /endforeach\($1\)$/,
                tokenType: 'keyword.tag-foreach'
            },
            {
                openTrigger: '\)',
                open: /function\((\w+)\)/i,
                closeComplete: 'endfunction\($1\)',
                matchCase: true,
                closeTrigger: '\)',
                close: /function\($1\)$/,
                tokenType: 'keyword.tag-function'
            },
            {
                openTrigger: '\)',
                open: /macro\((\w+)\)/i,
                closeComplete: 'endmacro\($1\)',
                matchCase: true,
                closeTrigger: '\)',
                close: /macro\($1\)$/,
                tokenType: 'keyword.tag-macro'
            }
        ];

        // we include these common regular expressions
        public symbols = /[=><!~?&|+\-*\/\^;\.,]+/;
        public escapes= /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/;
        // The main tokenizer for our languages
        public tokenizer= {
            root: [
                [/([a-zA-Z_]\w*)( *\()/,  [{cases: { '@keywords': { token: 'keyword.$0' } , '@default': 'identifier.method'}}, '']],
                { include: '@whitespace' },
                [/\$\{\w+\}/, 'variable'],
                [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                [/0[xX][0-9a-fA-F_]*[0-9a-fA-F]/, 'number.hex'],
                [/\d+/, 'number'],
                [/"/, 'string', '@string."'],
                [/'/, 'string', '@string.\''],
            ],
            whitespace: [
                [/[ \t\r\n]+/, ''],
                [/#.*$/, 'comment'],
            ],
            string: [
                [/[^\\"'%]+/, { cases: { '@eos': { token: 'string', next: '@popall' }, '@default': 'string' } }],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/\$\{[\w ]+\}/, 'variable'],
                [/["']/, { cases: { '$#==$S2': { token: 'string', next: '@pop' }, '@default': 'string' } }],
                [/$/, 'string', '@popall']
            ],
        };
    }
