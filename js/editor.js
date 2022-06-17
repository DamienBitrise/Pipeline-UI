function download() {
  let text = editor.getValue();
  let fileName = 'bitrise.yml';
  const blob = new Blob([text], { type: "text/plain" });
  const downloadLink = document.createElement("a");
  downloadLink.download = fileName;
  downloadLink.innerHTML = "Download File";
  if (window.webkitURL) {
      // No need to add the download element to the DOM in Webkit.
      downloadLink.href = window.webkitURL.createObjectURL(blob);
  } else {
      downloadLink.href = window.URL.createObjectURL(blob);
      downloadLink.onclick = (event) => {
          if (event.target) {
              document.body.removeChild(event.target);
          }
      };
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
  }

  downloadLink.click();

  if (window.webkitURL) {
      window.webkitURL.revokeObjectURL(downloadLink.href);
  } else {
      window.URL.revokeObjectURL(downloadLink.href);
  }
};

function loadEditor(){
  window.editor = monaco.editor.create(document.getElementById('container'), {
        value: [`format_version: '8'
default_step_lib_source: https://github.com/bitrise-io/bitrise-steplib.git
project_type: ios
pipelines:
  pipeline_1:
    stages:
    - build: {}
    - test: {}
    - deploy: {}
  pipeline_2:
    stages:
    - build: {}
    - test: {}
  pipeline_3:
    stages:
    - build_parallel: {}
stages:
  build:
    workflows:
    - build: {}
  test:
    workflows:
    - tests_1: {}
    - tests_2: {}
    - tests_3: {}
    - tests_4: {}
    - tests_5: {}
  deploy:
    workflows:
    - deploy: {}
  build_parallel:
    workflows:
    - ios: {}
    - android: {}
workflows:
  build:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  tests_1:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  tests_2:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  tests_3:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  tests_4:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  tests_5:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  deploy:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  ios:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
  android:
    steps:
      - activate-ssh-key@4:
          run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
      - git-clone@6: {}
`].join('\n'),
        language: 'yaml',
        automaticLayout: true
      });
      monaco.editor.setTheme('vs-dark');
}