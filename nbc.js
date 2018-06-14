module.exports = class Classifier {
  constructor() {
    this._labelCounts = new Map();
    this._labelProbabilities = new Map();
    this._smoothing = 1.01;
    this._songList = {
      allChords: new Set(),
      difficulties: ['easy', 'medium', 'hard'],
      songs: [],
      addSong(name, chords, difficulty) {
        this.songs.push({
          name,
          chords,
          difficulty: this.difficulties[difficulty]
        });
      }
    };
  }

  addSong(...songParams) {
    this._songList.addSong(...songParams);
  }

  trainAll() {
    this._songList.songs.forEach(song =>
      this.train(song.chords, song.difficulty)
    );
    this.setLabelProbabilities();
  }

  train(chords, label) {
    chords.forEach(chord => this._songList.allChords.add(chord));
    if (Array.from(this._labelCounts.keys()).includes(label)) {
      this._labelCounts.set(label, this._labelCounts.get(label) + 1);
    } else {
      this._labelCounts.set(label, 1);
    }
  }

  setLabelProbabilities() {
    this._labelCounts.forEach((_count, label) =>
      this._labelProbabilities.set(
        label,
        this._labelCounts.get(label) / this._songList.songs.length
      )
    );
  }

  setChordCountsInLabels() {
    this._songList.songs.forEach(song => {
      if (this.chordCountsInLabels.get(song.difficulty) === undefined) {
        this.chordCountsInLabels.set(song.difficulty, {});
      }
      song.chords.forEach(chord => {
        if (this.chordCountsInLabels.get(song.difficulty)[chord] > 0) {
          this.chordCountsInLabels.get(song.difficulty)[chord] += 1;
        } else {
          this.chordCountsInLabels.get(song.difficulty)[chord] = 1;
        }
      });
    });
  }

  chordCountForDifficulty(difficulty, testChord) {
    return this._songList.songs.reduce((counter, song) => {
      if (song.difficulty === difficulty) {
        counter += song.chords.filter(chord => chord === testChord).length;
      }
      return counter;
    }, 0);
  }

  likelihoodFromChord(difficulty, chord) {
    return (
      this.chordCountForDifficulty(difficulty, chord) /
      this._songList.songs.length
    );
  }

  valueForChordDifficulty(difficulty, chord) {
    const value = this.likelihoodFromChord(difficulty, chord);
    return value ? value + this._smoothing : 1;
  }

  classify(chords) {
    return new Map(
      Array.from(this._labelProbabilities.entries()).map(
        labelWithProbability => {
          const difficulty = labelWithProbability[0];
          return [
            difficulty,
            chords.reduce((total, chord) => {
              return total * this.valueForChordDifficulty(difficulty, chord);
            }, this._labelProbabilities.get(difficulty) + this._smoothing)
          ];
        }
      )
    );
  }
};
