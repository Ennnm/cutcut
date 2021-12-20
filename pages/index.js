import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { useEffect, useState, useRef, useContext } from 'react';

import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { cleanClip } from '../lib/clip-handlers/cleanClip';
import { extractAudioClip } from '../lib/clip-handlers/extractAudioClip';
import { optimiseAudioClip } from '../lib/clip-handlers/optimiseAudioClip';
import { transcribeClip } from '../lib/clip-handlers/transcribeToClip';

import { transcript } from '../lib/videoprocessing/transcript_2_flac_narrowband';

import { Loader } from '../components/Loader';
// ============FIREBASE=============
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  onSnapshot,
} from 'firebase/firestore';
//import needed to get firebase initiated
import { firestore, auth } from '../lib/firebase';

// ============FIREBASE=============
const ffmpeg = createFFmpeg({
  corePath: '/ffmpeg-core/ffmpeg-core.js',
});
export default function Home() {
  // const { user, username } = useContext(UserContext);

  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState();
  const [audio, setAudio] = useState();
  const [cleanedClip, setCleanedClip] = useState();
  const [transcription, setTranscription] = useState();
  const progressRatio = useRef(0);
  let user = auth.currentUser;
  // if (user == null) {
  //   user = { uid: 'test' };
  // }
  console.log('user', user);
  // const [progressRatio, setProgressRatio] = useState(0);

  // temporary transcript

  const IMPORTFILENAME = 'test.mp4';
  const AUDIOFILENAME = 'test.aac';
  const SILENCESFILENAME = 'silence.txt';
  const FINALAUDIO = 'finalAudio.aac';
  const PROCESSEDAUDIOFN = 'finalcut.mp4';
  let CONCATFILENAME = '';

  const load = async () => {
    if (!ffmpeg.isLoaded()) {
      console.log('ffmpeg was not loaded');
      try {
        await ffmpeg.load().then(() => setReady(true));
        await ffmpeg.setProgress((p) => {
          console.log('ratio', p);
          // setProgressRatio(p.ratio);
          progressRatio.current = p.ratio;
        });
      } catch (e) {
        console.log('error loading ffmpeg', e);
        location.reload();
      }
    } else {
      console.log('ffmpeg loaded');
      setReady(true);
    }
  };

  useEffect(() => {
    load();
  }, []); // only called once

  useEffect(() => {
    //check auth for user
    if (user !== null) {
      const userUid = user.uid;
      console.log('userUid', userUid);
      //listen for transcript
      const unsub = onSnapshot(
        doc(firestore, 'transcripts', userUid),
        (doc) => {
          if (doc.data() !== undefined && 'response' in doc.data()) {
            console.log('currentdata:2', JSON.parse(doc.data().response));
            setTranscription(JSON.parse(doc.data().response).result);
          }
        }
      );
    } else {
      console.log('no user logged in, please log in');
    }
  }, [audio]);
  return (
    <div className={styles.container}>
      <Head>
        <title>SuccinctCut</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Succinct Cut</h1>
        {user === null && <h3>Please log in</h3>}
        {ready && user !== null ? (
          <div className="App">
            {video && (
              <video
                controls
                width="250"
                src={URL.createObjectURL(video)}
              ></video>
            )}
            <input
              type="file"
              onChange={(e) => {
                setVideo(e.target.files?.item(0));
                console.log(
                  'e.target.files?.item(0) :>> ',
                  e.target.files?.item(0)
                );
              }}
            />
            <h3>Progress {progressRatio.current} </h3>
            {video && (
              <>
                <button
                  onClick={() => {
                    extractAudioClip(
                      ffmpeg,
                      video,
                      IMPORTFILENAME,
                      FINALAUDIO,
                      setAudio
                    );
                  }}
                >
                  Extract audio
                </button>
                <button
                  onClick={() => {
                    optimiseAudioClip(
                      ffmpeg,
                      video,
                      IMPORTFILENAME,
                      AUDIOFILENAME,
                      CONCATFILENAME,
                      FINALAUDIO,
                      setAudio
                    );
                  }}
                >
                  Optimise audio
                </button>
              </>
            )}

            {/* {audio && (
              <button
                onClick={() => {
                  transcribeClip(ffmpeg, FINALAUDIO, setTranscription);
                }}
              >
                Transcribe
              </button>
            )} */}
            {audio && (
              <button
                onClick={() => {
                  cleanClip(
                    transcription,
                    ffmpeg,
                    video,
                    IMPORTFILENAME,
                    CONCATFILENAME,
                    PROCESSEDAUDIOFN,
                    setCleanedClip
                  );
                }}
              >
                Clean clip
              </button>
            )}
            {audio && <video controls width="250" src={audio}></video>}
            {transcription && <p>{JSON.stringify(transcription)}</p>}
            {cleanedClip && (
              <video controls width="250" src={cleanedClip}></video>
            )}
          </div>
        ) : (
          <Loader show={true} />
          // <p>Loading...</p>
        )}
        <div className={styles.grid}></div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by En & Sn
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
}
