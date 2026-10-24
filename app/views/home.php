<div id="board">
  <form class="card" id="authCard" autocomplete="off" novalidate>
    <div class="pin"></div>
    <div class="stamp" id="stamp">ACCESS<br>GRANTED</div>

    <div class="card-top">
      <span class="dot" id="dot"></span>
      <h1 class="card-title" id="title">Sign In</h1>
    </div>
    <p class="eyebrow" id="eyebrow">catalog access · card 001</p>

    <div class="field">
      <label for="username">Username</label>
      <div class="field-input-wrap">
        <input id="username" name="username" type="text" placeholder="e.g. dr.cadillac" autocomplete="off" />
      </div>
    </div>

    <div class="field">
      <label for="password">Password</label>
      <div class="field-input-wrap">
        <input id="password" name="password" type="password" autocomplete="off" />
        <button type="button" class="toggle-visibility" id="toggleVis">show</button>
      </div>
    </div>

    <div class="field" id="confirmField" style="display:none;">
      <label for="confirm">Confirm password</label>
      <div class="field-input-wrap">
        <input id="confirm" name="confirm" type="password" autocomplete="off" />
      </div>
    </div>

    <p class="msg" id="msg"></p>

    <button type="submit" class="btn" id="submitBtn">Sign in</button>

    <p class="switch-row">
      <span id="switchPrompt">No card on file yet?</span>
      <button type="button" class="switch-link" id="switchLink">Create one</button>
    </p>

    <span class="accession" id="accession">no. 001</span>
  </form>
</div>