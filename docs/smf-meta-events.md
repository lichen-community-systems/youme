# "Standard" MIDI File Meta-Events

[MIDI "Voice" messages](midi-events.md) are commonly passed between devices such as a keyboard and a synthesizer. There
are also "meta" events that are unique to "Standard" MIDI files, which provide additional metadata about a track,
and allow for things like changing the tempo while playing a series of "voice" messages.  This page describes the
supported range of messages and provides examples of each message type in the JSON format YouMe uses to represent them.

## Sequence Number

An optional event used to identify which "sequence" a track represents.  Intended to occur at the beginning of a track.

```json5
{
    type: "sequenceNumber",
    value: 1
}
```

## Text Event

A free ASCII text event, generally notes or comments, and generally found at the beginning of a track.

```json5
{
    type: "text",
    value: "Best played on a busted speaker at the bottom of a well."
}
```

## Copyright Notice

A copyright notice in ASCII text format.

```json5
{
    type: "copyright",
    value: "Copyright 2023, Tony Atkins"
}
```

## Track Name

The ASCII name of the track.

```json5
{
    type: "name",
    value: "Percussion Section"
}
```

## Instrument Name

An optional description of the type of instrument to be used to play a track.

```json5
{
    type: "instrumentName",
    value: "Bass Glockenspiel"
}
```

## Lyric

An ASCII lyric representing one or more words or syllables to be sung at a point in time.  Used heavily in Karaoke
(.kar) files.

```json5
{
    type: "lyric",
    value: "a sea change"
}
```

## Marker

An ASCII marker for a point in the sequence.

```json5
{
    type: "marker",
    value: "Chorus"
}
```

## Cue Point

An ASCII "Cue Point", or kind of stage direction to assist in synchronising with film, video, or performance.

```json5
{
    type: "cuePoint",
    value: "All exit stage left."
}
```

## MIDI Channel Prefix

A MIDI channel (0-15) to use for all voice messages contained in this track.  Presumably supersedes the channel information
used in individual voice messages for devices that support this.

```json5
{
    type: "channelPrefix",
    value: 3
}
```

## MIDI port

Although this does not appear to be part of the standard, various SMF editing tools include a "MIDI port", presumably
as a means of addressing more than 16 "channels" by specifying a port in addition to a channel.

```json5
{
    type: "port",
    value: 9
}
```

## End of Track

Indicates that the track is complete.  Required at the end of each track.

```json5
{
    type: "endOfTrack"
}
```

## Set Tempo

The new tempo, in microseconds per quarter-note.  Supports 3 bytes, or as many as `16,777,215` microseconds per quarter
note.  Again, this is _microseconds_, not milliseconds, so the maximum value is `16.777215` seconds.

```json5
{
    type: "tempo",
    value: 500000 // The default, 0.5 seconds per quarter note
}
```

## SMPTE Offset

An optional representation of the starting time in [SMPTE format](https://en.wikipedia.org/wiki/SMPTE_timecode).  Should
be included at the beginning of the track.

```json5
{
    type: "smpteOffset",
    hour: 11,
    minute: 19,
    second: 25,
    frame: 5,
    fractionalFrame: 50
}
```

The time values for `hour`, `minute` and `second` should be self-explanatory.  The last two values assume a particular
number of frames per second (set in the SMF file header), and indicate which `frame` and fraction of a frame
(`fractionalFrame`) should be used as the starting point.

## Time Signature

The time signature from this point of the track forwards.  TODO: Confirm that that is informational and doesn't actually
affect the timing in most implementations.

```json5
{
    type: "timeSignature",
    numerator: 3,
    denominator: 4,
    midiClocksPerMetronomeClick: 24,
    thirtySecondNotesPerMidiQuarterNote: 4
}
```

## Key Signature

The key signature from this point of the track forwards.  A positive `sf` value indicates the number of sharps.  A
negative `sf` value indicates the number of flats. An `sf` of zero indicates that there are no sharps or flats (i.e. the
piece is in the key of C). The value of `mi` indicates whether the key is `major` or `minor`.

```json5
{
    type: "keySignature",
    sf: 4,
    mi: "major"
}
```

See [this page](https://musictheory.pugetsound.edu/mt21c/MajorKeySignatures.html) for more information on calculating
the key from the number of sharps/flats, and vice versa.

## Sequencer-Specific Meta-Event

A specific set of instructions for a particular sequencer when reading a given MIDI file.  The `value` here is the
raw bytes as unsigned 8-bit integers.

```json5
{
    type: "sequencerSpecificMetaEvent",
    value: [
        0x0B,
        0x13
    ]
}
```
