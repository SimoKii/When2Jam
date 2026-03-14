# When2Jam

When2meet으로 모은 밴드 합주 가능 일정을 **한눈에 보기** 위한 웹 앱입니다.  
주 단위 그리드로 “언제 몇 명이 가능한지”를 보고, 조건(최소 인원 + 필수 멤버)을 만족하는 시간대는 강조됩니다. 셀을 누르면 그 시간에 가능한 사람을 역할별로 모달에서 확인할 수 있습니다.

## 실행

```bash
npm install
npm run dev
```

`http://localhost:5173` 에서 확인할 수 있습니다.

## 일정 데이터

프로젝트의 `public/` 폴더에 있는 CSV 파일(여러 주 분)을 메인에서 자동으로 불러와 합쳐서 보여줍니다.  
When2meet에서 CSV를 추출한 뒤 해당 파일들을 `public/`에 넣고, 필요하면 `npm run merge-csv`로 한 번에 병합할 수 있습니다.

## 배포

정적 사이트이므로 `npm run build` 후 `dist` 폴더를 Vercel, Netlify 등에 배포하면 됩니다.
